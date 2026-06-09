"""
Application configuration management.
Loads settings from environment variables with sensible defaults.
"""

import json
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    """Central configuration for the Operations Intelligence Platform."""

    # --- Gemini AI ---
    gemini_api_key: str = Field(..., description="Google Gemini API key")
    gemini_model: str = Field("gemini-2.5-flash", description="Gemini model for chat/summarization")
    gemini_embedding_model: str = Field("text-embedding-004", description="Gemini embedding model")

    # --- OpenRouter AI ---
    openrouter_api_key: str = Field(..., description="OpenRouter API key")
    openrouter_model: str = Field("google/gemini-2.5-flash", description="OpenRouter model for chat/summarization")

    # --- Database ---
    database_url: str = Field("sqlite:///./ops_intel.db", description="SQLAlchemy database URL")

    # --- ChromaDB ---
    chroma_persist_dir: str = Field("./chroma_db", description="ChromaDB persistence directory")

    # --- File Upload ---
    upload_dir: str = Field("./uploads", description="Directory for uploaded files")
    max_upload_size_mb: int = Field(50, description="Max upload size in MB")

    # --- Server ---
    host: str = Field("0.0.0.0", description="Server host")
    port: int = Field(8000, description="Server port")
    cors_origins: str = Field(
        '["http://localhost:3000","http://127.0.0.1:3000"]',
        description="Allowed CORS origins as JSON string"
    )

    # --- Logging ---
    log_level: str = Field("INFO", description="Logging level")

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from JSON string to list."""
        try:
            return json.loads(self.cors_origins)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:3000"]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Singleton settings instance
settings = Settings()
