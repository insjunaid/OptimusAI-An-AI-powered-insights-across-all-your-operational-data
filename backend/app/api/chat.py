"""
AI Chat API endpoints — RAG-powered conversational interface.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schemas import ChatHistory
from app.models.api_models import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    SourceReference,
)
from app.services.rag_service import rag_service
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/workspaces/{workspace_id}/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    workspace_id: str,
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Send a query to the AI assistant.
    Uses RAG to retrieve relevant context from uploaded documents,
    then generates a response using Gemini.
    """
    try:
        # Step 1: Retrieve relevant context from vector store
        context = await rag_service.get_context(workspace_id, request.query)
        raw_results = await rag_service.query(workspace_id, request.query)

        # Step 2: Get recent chat history for conversation continuity
        recent_chats = (
            db.query(ChatHistory)
            .filter(ChatHistory.workspace_id == workspace_id)
            .order_by(ChatHistory.created_at.desc())
            .limit(5)
            .all()
        )
        history = [
            {"query": c.query, "response": c.response}
            for c in reversed(recent_chats)
        ]

        # Step 3: Generate AI response
        response_text = await ai_service.chat(
            query=request.query,
            context=context,
            history=history,
        )

        # Step 4: Build source references
        sources = []
        if request.include_sources and raw_results:
            for r in raw_results:
                sources.append(SourceReference(
                    document=r["metadata"].get("filename", "Unknown"),
                    chunk=r["content"][:200] + "..." if len(r["content"]) > 200 else r["content"],
                    relevance=r["relevance_score"],
                ))

        # Step 5: Save to chat history
        chat_record = ChatHistory(
            workspace_id=workspace_id,
            query=request.query,
            response=response_text,
            sources=json.dumps([s.model_dump() for s in sources]) if sources else None,
        )
        db.add(chat_record)
        db.commit()
        db.refresh(chat_record)

        return ChatResponse(
            id=chat_record.id,
            query=request.query,
            response=response_text,
            sources=sources,
            created_at=chat_record.created_at,
        )

    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history(
    workspace_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Get chat history for a workspace."""
    messages = (
        db.query(ChatHistory)
        .filter(ChatHistory.workspace_id == workspace_id)
        .order_by(ChatHistory.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for msg in reversed(messages):
        sources = []
        if msg.sources:
            try:
                sources = [SourceReference(**s) for s in json.loads(msg.sources)]
            except (json.JSONDecodeError, TypeError):
                pass

        result.append(ChatResponse(
            id=msg.id,
            query=msg.query,
            response=msg.response,
            sources=sources,
            created_at=msg.created_at,
        ))

    return ChatHistoryResponse(messages=result, total=len(result))
