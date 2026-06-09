"""
File parsing utilities for extracting text from various document formats.
Supports: PDF, TXT, CSV, JSON, LOG files, and images (via Gemini Vision).
"""

import csv
import io
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Supported file extensions
TEXT_EXTENSIONS = {".txt", ".log", ".md", ".yaml", ".yml", ".xml", ".html"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
SUPPORTED_EXTENSIONS = TEXT_EXTENSIONS | IMAGE_EXTENSIONS | {".pdf", ".csv", ".json"}


def get_file_type(filename: str) -> str:
    """Determine file type from extension."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return "pdf"
    elif ext == ".csv":
        return "csv"
    elif ext == ".json":
        return "json"
    elif ext in IMAGE_EXTENSIONS:
        return ext.lstrip(".")
    elif ext in TEXT_EXTENSIONS:
        return ext.lstrip(".") or "txt"
    else:
        return "unknown"


def is_supported_file(filename: str) -> bool:
    """Check if a file type is supported."""
    ext = Path(filename).suffix.lower()
    return ext in SUPPORTED_EXTENSIONS


def is_image_file(filename: str) -> bool:
    """Check if file is an image."""
    ext = Path(filename).suffix.lower()
    return ext in IMAGE_EXTENSIONS


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from a PDF file."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        text_parts = []
        for page_num, page in enumerate(reader.pages, 1):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(f"[Page {page_num}]\n{page_text}")
        return "\n\n".join(text_parts)
    except Exception as e:
        logger.error(f"PDF extraction failed for {file_path}: {e}")
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def extract_text_from_csv(file_path: str) -> str:
    """Convert CSV file to readable text format."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.reader(f)
            rows = list(reader)

        if not rows:
            return ""

        # Format as readable table
        headers = rows[0] if rows else []
        text_parts = [f"CSV Data ({len(rows) - 1} rows, {len(headers)} columns)"]
        text_parts.append(f"Columns: {', '.join(headers)}")
        text_parts.append("")

        for i, row in enumerate(rows[:100]):  # Limit to first 100 rows for processing
            text_parts.append(" | ".join(row))

        if len(rows) > 100:
            text_parts.append(f"\n... and {len(rows) - 100} more rows")

        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"CSV extraction failed for {file_path}: {e}")
        raise ValueError(f"Failed to extract text from CSV: {str(e)}")


def extract_text_from_json(file_path: str) -> str:
    """Convert JSON file to readable text format."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            data = json.load(f)
        return f"JSON Data:\n{json.dumps(data, indent=2, default=str)}"
    except Exception as e:
        logger.error(f"JSON extraction failed for {file_path}: {e}")
        raise ValueError(f"Failed to extract text from JSON: {str(e)}")


def extract_text_from_text_file(file_path: str) -> str:
    """Read plain text files (TXT, LOG, MD, etc.)."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Text extraction failed for {file_path}: {e}")
        raise ValueError(f"Failed to read text file: {str(e)}")


def extract_text(file_path: str, filename: str) -> Optional[str]:
    """
    Main extraction dispatcher — routes to appropriate parser based on file type.
    Returns extracted text or None for images (handled separately by Gemini Vision).
    """
    file_type = get_file_type(filename)

    if file_type == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type == "csv":
        return extract_text_from_csv(file_path)
    elif file_type == "json":
        return extract_text_from_json(file_path)
    elif file_type in {"txt", "log", "md", "yaml", "yml", "xml", "html"}:
        return extract_text_from_text_file(file_path)
    elif file_type in {"png", "jpg", "jpeg", "gif", "webp"}:
        return None  # Images handled by Gemini Vision in ai_service
    else:
        logger.warning(f"Unsupported file type: {file_type} for {filename}")
        return None
