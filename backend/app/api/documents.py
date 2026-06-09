"""
Document upload and management API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.api_models import DocumentResponse, DocumentListResponse, UploadResponse, SuccessResponse
from app.services import document_service
from app.services.rag_service import rag_service
from app.services.ai_service import ai_service
from app.utils.file_parser import is_supported_file

router = APIRouter(prefix="/api", tags=["Documents"])


@router.post("/workspaces/{workspace_id}/upload", response_model=UploadResponse)
async def upload_file(
    workspace_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a file to a workspace.
    Supports: PDF, TXT, CSV, JSON, LOG, PNG, JPG, JPEG
    Files are automatically processed, chunked, and indexed for RAG.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    if not is_supported_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: PDF, TXT, CSV, JSON, LOG, PNG, JPG, JPEG"
        )

    try:
        document = await document_service.upload_and_process(
            db=db,
            workspace_id=workspace_id,
            file=file,
            rag_service=rag_service,
            ai_service=ai_service,
        )
        return UploadResponse(
            message=f"File '{file.filename}' uploaded and processed successfully",
            document=DocumentResponse.model_validate(document),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/workspaces/{workspace_id}/upload/batch")
async def upload_multiple_files(
    workspace_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """Upload multiple files to a workspace."""
    results = []
    errors = []

    for file in files:
        try:
            if not is_supported_file(file.filename):
                errors.append({"filename": file.filename, "error": "Unsupported file type"})
                continue

            document = await document_service.upload_and_process(
                db=db,
                workspace_id=workspace_id,
                file=file,
                rag_service=rag_service,
                ai_service=ai_service,
            )
            results.append(DocumentResponse.model_validate(document))
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})

    return {
        "message": f"Processed {len(results)} files successfully, {len(errors)} errors",
        "documents": results,
        "errors": errors,
    }


@router.get("/workspaces/{workspace_id}/files", response_model=DocumentListResponse)
def list_files(workspace_id: str, db: Session = Depends(get_db)):
    """List all files in a workspace."""
    documents = document_service.get_documents(db, workspace_id)
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in documents],
        total=len(documents),
    )


@router.delete("/files/{document_id}", response_model=SuccessResponse)
def delete_file(document_id: str, db: Session = Depends(get_db)):
    """Delete a file and its indexed data."""
    deleted = document_service.delete_document(db, document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")
    return SuccessResponse(message="File deleted successfully")
