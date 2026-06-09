"""
Workspace service — CRUD operations for workspaces.
"""

import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.models.schemas import Workspace, Document, ChatHistory
from app.models.api_models import WorkspaceCreate, WorkspaceResponse

logger = logging.getLogger(__name__)


def create_workspace(db: Session, data: WorkspaceCreate) -> Workspace:
    """Create a new workspace."""
    workspace = Workspace(
        name=data.name,
        description=data.description,
        workspace_type=data.workspace_type,
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    logger.info(f"Created workspace: {workspace.name} ({workspace.id})")
    return workspace


def get_workspaces(db: Session) -> List[dict]:
    """Get all workspaces with document and chat counts."""
    workspaces = db.query(Workspace).order_by(Workspace.created_at.desc()).all()
    result = []
    for ws in workspaces:
        doc_count = db.query(func.count(Document.id)).filter(Document.workspace_id == ws.id).scalar()
        chat_count = db.query(func.count(ChatHistory.id)).filter(ChatHistory.workspace_id == ws.id).scalar()
        result.append({
            "id": ws.id,
            "name": ws.name,
            "description": ws.description,
            "workspace_type": ws.workspace_type,
            "created_at": ws.created_at,
            "updated_at": ws.updated_at,
            "document_count": doc_count or 0,
            "chat_count": chat_count or 0,
        })
    return result


def get_workspace(db: Session, workspace_id: str) -> Optional[dict]:
    """Get a single workspace by ID with counts."""
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        return None
    doc_count = db.query(func.count(Document.id)).filter(Document.workspace_id == ws.id).scalar()
    chat_count = db.query(func.count(ChatHistory.id)).filter(ChatHistory.workspace_id == ws.id).scalar()
    return {
        "id": ws.id,
        "name": ws.name,
        "description": ws.description,
        "workspace_type": ws.workspace_type,
        "created_at": ws.created_at,
        "updated_at": ws.updated_at,
        "document_count": doc_count or 0,
        "chat_count": chat_count or 0,
    }


def delete_workspace(db: Session, workspace_id: str) -> bool:
    """Delete a workspace and all associated data."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        return False
    db.delete(workspace)
    db.commit()
    logger.info(f"Deleted workspace: {workspace.name} ({workspace_id})")
    return True
