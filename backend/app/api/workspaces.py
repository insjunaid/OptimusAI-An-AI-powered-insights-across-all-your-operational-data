"""
Workspace API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.api_models import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceListResponse,
    SuccessResponse,
)
from app.services import workspace_service

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=201)
def create_workspace(data: WorkspaceCreate, db: Session = Depends(get_db)):
    """Create a new workspace/project."""
    workspace = workspace_service.create_workspace(db, data)
    return workspace_service.get_workspace(db, workspace.id)


@router.get("", response_model=WorkspaceListResponse)
def list_workspaces(db: Session = Depends(get_db)):
    """List all workspaces with document and chat counts."""
    workspaces = workspace_service.get_workspaces(db)
    return WorkspaceListResponse(workspaces=workspaces, total=len(workspaces))


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: str, db: Session = Depends(get_db)):
    """Get workspace details by ID."""
    workspace = workspace_service.get_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.delete("/{workspace_id}", response_model=SuccessResponse)
def delete_workspace(workspace_id: str, db: Session = Depends(get_db)):
    """Delete a workspace and all its data."""
    deleted = workspace_service.delete_workspace(db, workspace_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return SuccessResponse(message="Workspace deleted successfully")
