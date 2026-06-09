"""
Document service — handles file upload, storage, and processing pipeline.
Orchestrates: save file → extract text → chunk → embed → store in vector DB.
"""

import logging
import os
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.models.schemas import Document, DocumentStatus
from app.utils.file_parser import (
    extract_text,
    get_file_type,
    is_supported_file,
    is_image_file,
)

logger = logging.getLogger(__name__)


async def upload_and_process(
    db: Session,
    workspace_id: str,
    file: UploadFile,
    rag_service,
    ai_service,
) -> Document:
    """
    Complete upload pipeline:
    1. Save file to disk
    2. Create DB record
    3. Extract text (or analyze image via Gemini Vision)
    4. Chunk and embed via RAG service
    5. Update document status
    """
    # Validate file type
    if not is_supported_file(file.filename):
        raise ValueError(f"Unsupported file type: {file.filename}")

    # Generate unique filename to avoid collisions
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    upload_dir = Path(settings.upload_dir) / workspace_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / unique_filename

    # Save file to disk
    content = await file.read()
    file_size = len(content)

    if file_size > settings.max_upload_size_bytes:
        raise ValueError(f"File too large. Maximum size is {settings.max_upload_size_mb}MB")

    with open(file_path, "wb") as f:
        f.write(content)

    # Create database record
    document = Document(
        workspace_id=workspace_id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type=get_file_type(file.filename),
        file_size=file_size,
        status=DocumentStatus.PROCESSING.value,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Process the document
    try:
        extracted_text = None

        if is_image_file(file.filename):
            # Use Gemini Vision for image analysis
            logger.info(f"Analyzing image with Gemini Vision: {file.filename}")
            extracted_text = await ai_service.analyze_image(str(file_path))
            if extracted_text:
                extracted_text = f"[Image Analysis: {file.filename}]\n{extracted_text}"
        else:
            # Extract text using file parser
            extracted_text = extract_text(str(file_path), file.filename)

        if extracted_text:
            # Store content preview (first 500 chars)
            document.content_preview = extracted_text[:500]

            # Chunk and embed via RAG service
            chunk_count = await rag_service.add_document(
                workspace_id=workspace_id,
                document_id=document.id,
                text=extracted_text,
                metadata={
                    "filename": file.filename,
                    "file_type": document.file_type,
                    "document_id": document.id,
                },
            )
            document.chunk_count = chunk_count
            document.status = DocumentStatus.READY.value
            logger.info(f"Document processed: {file.filename} → {chunk_count} chunks")
        else:
            document.status = DocumentStatus.READY.value
            document.content_preview = "[No text content extracted]"
            logger.warning(f"No text extracted from: {file.filename}")

    except Exception as e:
        document.status = DocumentStatus.ERROR.value
        document.error_message = str(e)
        logger.error(f"Document processing failed for {file.filename}: {e}")

    db.commit()
    db.refresh(document)
    return document


def get_documents(db: Session, workspace_id: str) -> List[Document]:
    """Get all documents in a workspace."""
    return (
        db.query(Document)
        .filter(Document.workspace_id == workspace_id)
        .order_by(Document.created_at.desc())
        .all()
    )


def get_document(db: Session, document_id: str) -> Optional[Document]:
    """Get a single document by ID."""
    return db.query(Document).filter(Document.id == document_id).first()


def delete_document(db: Session, document_id: str) -> bool:
    """Delete a document and its file from disk."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return False

    # Remove file from disk
    file_path = Path(settings.upload_dir) / doc.workspace_id / doc.filename
    if file_path.exists():
        file_path.unlink()

    db.delete(doc)
    db.commit()
    logger.info(f"Deleted document: {doc.original_filename} ({document_id})")
    return True
