"""
SQLAlchemy ORM models — defines the database schema.
These models are database-agnostic (SQLite / PostgreSQL).
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.database.connection import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class WorkspaceType(str, enum.Enum):
    """Supported workspace categories."""
    ENGINEERING = "engineering"
    INCIDENT = "incident"
    SUPPORT = "support"
    RESEARCH = "research"
    CUSTOM = "custom"


class DocumentStatus(str, enum.Enum):
    """Document processing pipeline status."""
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


class Workspace(Base):
    """Workspace/project container for organizing operational data."""
    __tablename__ = "workspaces"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    workspace_type = Column(String(50), default=WorkspaceType.CUSTOM.value)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    documents = relationship("Document", back_populates="workspace", cascade="all, delete-orphan")
    chat_messages = relationship("ChatHistory", back_populates="workspace", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="workspace", cascade="all, delete-orphan")


class Document(Base):
    """Uploaded document with processing metadata."""
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, txt, csv, json, log, png, jpg, jpeg
    file_size = Column(Integer, default=0)  # bytes
    content_preview = Column(Text, nullable=True)  # first ~500 chars of extracted text
    status = Column(String(20), default=DocumentStatus.PENDING.value)
    chunk_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="documents")


class ChatHistory(Base):
    """Conversation history for AI chat sessions."""
    __tablename__ = "chat_history"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)  # JSON string of source references
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="chat_messages")


class Summary(Base):
    """AI-generated summaries for documents or workspaces."""
    __tablename__ = "summaries"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(String, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    summary_type = Column(String(50), nullable=False)  # incident, operational, document, workspace
    content = Column(Text, nullable=False)
    key_issues = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="summaries")
