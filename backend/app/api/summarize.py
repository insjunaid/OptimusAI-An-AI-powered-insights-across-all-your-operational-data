"""
Summarization API endpoints.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schemas import Summary, Document
from typing import List
from app.models.api_models import SummarizeRequest, SummaryResponse
from app.services.ai_service import ai_service
from app.services import document_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Summarization"])

@router.get("/workspaces/{workspace_id}/summaries", response_model=List[SummaryResponse])
def get_summaries(workspace_id: str, db: Session = Depends(get_db)):
    """Fetch all past summaries generated in this workspace."""
    summaries = db.query(Summary).filter(Summary.workspace_id == workspace_id).order_by(Summary.created_at.desc()).all()
    
    return [
        SummaryResponse(
            id=s.id,
            workspace_id=s.workspace_id,
            document_id=s.document_id,
            summary_type=s.summary_type,
            content=s.content,
            key_issues=json.loads(s.key_issues) if s.key_issues else [],
            created_at=s.created_at,
        )
        for s in summaries
    ]

@router.post("/workspaces/{workspace_id}/summarize", response_model=SummaryResponse)
async def summarize_workspace(
    workspace_id: str,
    request: SummarizeRequest,
    db: Session = Depends(get_db),
):
    """
    Generate an AI summary of all documents in a workspace.
    Aggregates content previews and generates insights.
    """
    try:
        documents = document_service.get_documents(db, workspace_id)
        if not documents:
            raise HTTPException(status_code=400, detail="No documents in this workspace to summarize")

        # Aggregate document content previews
        combined_text = ""
        for doc in documents:
            if doc.content_preview:
                combined_text += f"\n\n--- {doc.original_filename} ---\n{doc.content_preview}"

        if not combined_text.strip():
            raise HTTPException(status_code=400, detail="No text content available for summarization")

        result = await ai_service.summarize(combined_text, request.summary_type)

        # Save summary
        summary = Summary(
            workspace_id=workspace_id,
            summary_type=request.summary_type,
            content=result["content"],
            key_issues=json.dumps(result.get("key_issues", [])),
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)

        return SummaryResponse(
            id=summary.id,
            workspace_id=workspace_id,
            document_id=None,
            summary_type=request.summary_type,
            content=result["content"],
            key_issues=result.get("key_issues", []),
            created_at=summary.created_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Workspace summarization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@router.post("/documents/{document_id}/summarize", response_model=SummaryResponse)
async def summarize_document(
    document_id: str,
    request: SummarizeRequest,
    db: Session = Depends(get_db),
):
    """Generate an AI summary of a single document."""
    doc = document_service.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.content_preview:
        raise HTTPException(status_code=400, detail="No text content available for this document")

    try:
        result = await ai_service.summarize(doc.content_preview, request.summary_type)

        summary = Summary(
            workspace_id=doc.workspace_id,
            document_id=document_id,
            summary_type=request.summary_type,
            content=result["content"],
            key_issues=json.dumps(result.get("key_issues", [])),
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)

        return SummaryResponse(
            id=summary.id,
            workspace_id=doc.workspace_id,
            document_id=document_id,
            summary_type=request.summary_type,
            content=result["content"],
            key_issues=result.get("key_issues", []),
            created_at=summary.created_at,
        )

    except Exception as e:
        logger.error(f"Document summarization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")
