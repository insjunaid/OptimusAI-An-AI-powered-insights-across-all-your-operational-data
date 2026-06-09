"""
AI Service — OpenRouter integration for chat, summarization, and image analysis.
Uses OpenAI-compatible SDK for OpenRouter access.
"""

import logging
import base64
from typing import Optional, List, Dict

from openai import AsyncOpenAI
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Handles all AI operations: chat, summarize, vision analysis via OpenRouter."""

    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )
        self.model_name = settings.openrouter_model

    async def chat(
        self,
        query: str,
        context: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """
        Generate a RAG-powered chat response.
        Uses retrieved context to ground the response in actual data.
        """
        system_prompt = """You are an AI Operations Intelligence Assistant. Your role is to help teams 
analyze operational data, incidents, and documents that have been uploaded to the platform.

IMPORTANT RULES:
1. Base your answers ONLY on the provided context from uploaded documents.
2. If the context doesn't contain relevant information, say so clearly.
3. Always cite which source document your information comes from.
4. Be concise but thorough — this is an enterprise operations tool.
5. If you identify potential issues, risks, or actionable insights, highlight them.
6. Format your response with clear structure (headings, bullet points) when helpful."""

        messages = [{"role": "system", "content": system_prompt}]

        if context and context != "No relevant documents found in this workspace.":
            messages.append({"role": "system", "content": f"RELEVANT CONTEXT FROM UPLOADED DOCUMENTS:\n{context}"})
        else:
            messages.append({"role": "system", "content": "NOTE: No relevant documents were found in this workspace. Answer based on general knowledge but clearly state that no workspace-specific data was found."})

        if history:
            for msg in history[-5:]:  # Last 5 exchanges
                messages.append({"role": "user", "content": msg.get('query', '')})
                messages.append({"role": "assistant", "content": msg.get('response', '')})

        messages.append({"role": "user", "content": query})

        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.3,
                max_tokens=2048,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenRouter chat failed: {e}")
            raise RuntimeError(f"AI chat failed: {str(e)}")

    async def summarize(
        self,
        text: str,
        summary_type: str = "operational",
    ) -> Dict[str, str]:
        """
        Generate an AI summary of text content.
        Returns both summary and extracted key issues.
        """
        prompts = {
            "incident": """Analyze the following incident data and provide:
1. **Incident Summary**: A clear, concise summary of what happened
2. **Root Cause Analysis**: Potential root causes based on the data
3. **Impact Assessment**: What was affected and severity
4. **Key Issues**: List of critical issues identified
5. **Recommended Actions**: Immediate and preventive actions

DATA:
{text}""",
            "operational": """Analyze the following operational data and provide:
1. **Executive Summary**: High-level overview of the operational state
2. **Key Metrics**: Important numbers and trends identified
3. **Issues & Risks**: Current problems or potential risks
4. **Key Issues**: List of items requiring attention
5. **Recommendations**: Suggested actions and improvements

DATA:
{text}""",
            "document": """Summarize the following document and provide:
1. **Document Summary**: Comprehensive summary of the content
2. **Key Points**: Most important takeaways
3. **Key Issues**: Any issues, problems, or action items mentioned
4. **Relevant Details**: Technical details or data worth noting

DOCUMENT:
{text}""",
            "workspace": """Analyze all the following data from a workspace and provide:
1. **Workspace Overview**: Summary of all content in this workspace
2. **Common Themes**: Recurring topics and patterns
3. **Key Issues**: Critical issues across all documents
4. **Insights**: AI-generated insights and observations
5. **Priority Actions**: Recommended next steps

WORKSPACE DATA:
{text}""",
        }

        prompt_template = prompts.get(summary_type, prompts["operational"])
        # Truncate text to avoid token limits
        truncated = text[:15000] if len(text) > 15000 else text
        prompt = prompt_template.format(text=truncated)

        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=2048,
            )

            result_text = response.choices[0].message.content
            key_issues = self._extract_key_issues(result_text)

            return {
                "content": result_text,
                "key_issues": key_issues,
            }
        except Exception as e:
            logger.error(f"OpenRouter summarization failed: {e}")
            raise RuntimeError(f"AI summarization failed: {str(e)}")

    async def analyze_image(self, image_path: str) -> Optional[str]:
        """
        Analyze an image using OpenRouter Vision capabilities.
        Extracts visible text, describes content, and generates searchable summary.
        """
        try:
            with open(image_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')

            # Determine mime type roughly
            mime_type = "image/jpeg"
            if image_path.lower().endswith(".png"):
                mime_type = "image/png"

            prompt = """Analyze this image thoroughly and provide:
1. **Image Description**: What is shown in this image
2. **Visible Text**: Extract ALL text visible in the image (OCR)
3. **Key Information**: Important data points, error messages, metrics, or status indicators
4. **Context**: What this image appears to be (screenshot, diagram, error log, dashboard, etc.)
5. **Searchable Summary**: A text summary that makes this image's content findable via search

Be thorough in text extraction — capture every piece of visible text."""

            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.1,
                max_tokens=2048,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenRouter Vision analysis failed for {image_path}: {e}")
            return f"[Image analysis failed: {str(e)}]"

    def _extract_key_issues(self, text: str) -> List[str]:
        """Extract key issues from summary text as a list."""
        issues = []
        in_issues_section = False
        for line in text.split("\n"):
            stripped = line.strip()
            if "key issues" in stripped.lower() or "key issue" in stripped.lower():
                in_issues_section = True
                continue
            if in_issues_section:
                if stripped.startswith(("- ", "• ", "* ", "1.", "2.", "3.", "4.", "5.")):
                    issue = stripped.lstrip("-•* 0123456789.").strip()
                    if issue:
                        issues.append(issue)
                elif stripped.startswith("**") and not stripped.startswith("**Key"):
                    in_issues_section = False
                elif stripped == "":
                    continue
        return issues


# Singleton instance
ai_service = AIService()
