"""
Database connection and session management.
Uses SQLAlchemy ORM — works with SQLite (local) and PostgreSQL (production).
"""

import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator

from app.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy engine setup
# For SQLite, we need check_same_thread=False for FastAPI's async context
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session.
    Ensures proper cleanup after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database — creates all tables if they don't exist.
    Called on application startup.
    """
    from app.models import schemas  # noqa: F401 — triggers table registration
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")
