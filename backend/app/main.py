"""
AI-Powered Operations Intelligence Platform — FastAPI Application Entry Point.

This is the main application module that:
1. Configures the FastAPI app with CORS middleware
2. Registers all API routers
3. Initializes database and storage on startup
4. Provides health check endpoint
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.api import workspaces, documents, chat, summarize, dashboard, auth

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info("=" * 60)
    logger.info("  AI-Powered Operations Intelligence Platform")
    logger.info("=" * 60)

    # Initialize database
    init_db()
    logger.info("✓ Database initialized")

    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    logger.info(f"✓ Upload directory: {settings.upload_dir}")

    # Ensure ChromaDB directory exists
    os.makedirs(settings.chroma_persist_dir, exist_ok=True)
    logger.info(f"✓ ChromaDB directory: {settings.chroma_persist_dir}")

    logger.info(f"✓ Gemini model: {settings.gemini_model}")
    logger.info(f"✓ Embedding model: {settings.gemini_embedding_model}")
    logger.info("=" * 60)
    logger.info("  Server ready — accepting requests")
    logger.info("=" * 60)

    yield

    # Shutdown
    logger.info("Server shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Operations Intelligence Platform",
    description="AI-powered platform for operational data analysis, incident management, and intelligent querying",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — allows frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(workspaces.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(summarize.router)
app.include_router(dashboard.router)
app.include_router(auth.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "platform": "Operations Intelligence Platform",
        "version": "1.0.0",
        "ai_model": settings.gemini_model,
    }
