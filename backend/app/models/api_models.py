"""
Pydantic models for API request/response validation.
Separates API contracts from database models for clean architecture.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── Workspace ────────────────────────────────────────────

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Workspace name")
    description: Optional[str] = Field(None, description="Workspace description")
    workspace_type: str = Field("custom", description="Type: engineering, incident, support, research, custom")


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    workspace_type: str
    created_at: datetime
    updated_at: datetime
    document_count: int = 0
    chat_count: int = 0

    class Config:
        from_attributes = True


class WorkspaceListResponse(BaseModel):
    workspaces: List[WorkspaceResponse]
    total: int


# ─── Document ─────────────────────────────────────────────

class DocumentResponse(BaseModel):
    id: str
    workspace_id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    content_preview: Optional[str]
    status: str
    chunk_count: int
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int


class UploadResponse(BaseModel):
    message: str
    document: DocumentResponse


# ─── Chat ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User's question")
    include_sources: bool = Field(True, description="Include source references")


class SourceReference(BaseModel):
    document: str
    chunk: str
    relevance: float = 0.0


class ChatResponse(BaseModel):
    id: str
    query: str
    response: str
    sources: List[SourceReference] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: List[ChatResponse]
    total: int


# ─── Summary ──────────────────────────────────────────────

class SummarizeRequest(BaseModel):
    summary_type: str = Field("operational", description="Type: incident, operational, document, workspace")


class SummaryResponse(BaseModel):
    id: str
    workspace_id: str
    document_id: Optional[str]
    summary_type: str
    content: str
    key_issues: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Dashboard ────────────────────────────────────────────

class RecentUpload(BaseModel):
    id: str
    filename: str
    workspace_name: str
    file_type: str
    status: str
    created_at: datetime


class RecentQuery(BaseModel):
    id: str
    query: str
    workspace_name: str
    created_at: datetime


class InsightItem(BaseModel):
    title: str
    description: str
    type: str  # info, warning, success, action


class DashboardResponse(BaseModel):
    total_workspaces: int
    total_documents: int
    total_chats: int
    total_summaries: int
    recent_uploads: List[RecentUpload]
    recent_queries: List[RecentQuery]
    insights: List[InsightItem]


# ─── Generic ──────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None


class SuccessResponse(BaseModel):
    message: str
