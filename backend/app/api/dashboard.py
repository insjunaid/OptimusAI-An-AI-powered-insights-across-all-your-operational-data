"""
Dashboard API — aggregated statistics and AI-generated insights.
"""

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.schemas import Workspace, Document, ChatHistory, Summary
from app.models.api_models import (
    DashboardResponse,
    RecentUpload,
    RecentQuery,
    InsightItem,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    """
    Get aggregated dashboard data:
    - Total counts (workspaces, documents, chats, summaries)
    - Recent uploads and queries
    - AI-generated insights
    """
    # Aggregate counts
    total_workspaces = db.query(func.count(Workspace.id)).scalar() or 0
    total_documents = db.query(func.count(Document.id)).scalar() or 0
    total_chats = db.query(func.count(ChatHistory.id)).scalar() or 0
    total_summaries = db.query(func.count(Summary.id)).scalar() or 0

    # Recent uploads (last 10)
    recent_docs = (
        db.query(Document, Workspace.name)
        .join(Workspace, Document.workspace_id == Workspace.id)
        .order_by(Document.created_at.desc())
        .limit(10)
        .all()
    )
    recent_uploads = [
        RecentUpload(
            id=doc.id,
            filename=doc.original_filename,
            workspace_name=ws_name,
            file_type=doc.file_type,
            status=doc.status,
            created_at=doc.created_at,
        )
        for doc, ws_name in recent_docs
    ]

    # Recent queries (last 10)
    recent_chat_records = (
        db.query(ChatHistory, Workspace.name)
        .join(Workspace, ChatHistory.workspace_id == Workspace.id)
        .order_by(ChatHistory.created_at.desc())
        .limit(10)
        .all()
    )
    recent_queries = [
        RecentQuery(
            id=chat.id,
            query=chat.query[:100] + "..." if len(chat.query) > 100 else chat.query,
            workspace_name=ws_name,
            created_at=chat.created_at,
        )
        for chat, ws_name in recent_chat_records
    ]

    # Generate insights based on current data
    insights = _generate_insights(
        total_workspaces, total_documents, total_chats, total_summaries, db
    )

    return DashboardResponse(
        total_workspaces=total_workspaces,
        total_documents=total_documents,
        total_chats=total_chats,
        total_summaries=total_summaries,
        recent_uploads=recent_uploads,
        recent_queries=recent_queries,
        insights=insights,
    )


def _generate_insights(
    total_workspaces: int,
    total_documents: int,
    total_chats: int,
    total_summaries: int,
    db: Session,
) -> list:
    """Generate contextual insights based on platform data."""
    insights = []

    if total_workspaces == 0:
        insights.append(InsightItem(
            title="Get Started",
            description="Create your first workspace to begin organizing operational data.",
            type="info",
        ))
    else:
        insights.append(InsightItem(
            title="Active Workspaces",
            description=f"You have {total_workspaces} workspace(s) with {total_documents} document(s) indexed.",
            type="success",
        ))

    if total_documents > 0 and total_chats == 0:
        insights.append(InsightItem(
            title="Try AI Chat",
            description="You have documents uploaded. Try asking questions using the AI chat to get insights.",
            type="action",
        ))

    # Check for documents with errors
    error_docs = db.query(func.count(Document.id)).filter(Document.status == "error").scalar() or 0
    if error_docs > 0:
        insights.append(InsightItem(
            title="Processing Errors",
            description=f"{error_docs} document(s) had processing errors. Try re-uploading them.",
            type="warning",
        ))

    if total_chats > 5:
        insights.append(InsightItem(
            title="Active Analysis",
            description=f"Your team has made {total_chats} AI queries. Generate summaries for consolidated insights.",
            type="info",
        ))

    if total_documents > 0 and total_summaries == 0:
        insights.append(InsightItem(
            title="Generate Summaries",
            description="Use the summarization feature to get AI-generated overviews of your workspace data.",
            type="action",
        ))

    return insights
