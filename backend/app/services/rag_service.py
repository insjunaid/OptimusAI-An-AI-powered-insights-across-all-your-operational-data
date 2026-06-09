"""
RAG Service — Retrieval-Augmented Generation pipeline.
Uses LangChain + ChromaDB + Gemini Embeddings for semantic search.

Architecture:
  Document → Chunks → Embeddings → ChromaDB (per workspace collection)
  Query → Embed → Similarity Search → Top-K Chunks → Context for LLM
"""

import logging
from typing import List, Dict, Any, Optional

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

from app.config import settings

logger = logging.getLogger(__name__)


class RAGService:
    """Manages document indexing and retrieval using ChromaDB + Gemini Embeddings."""

    def __init__(self):
        self._embeddings = None
        self._text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    @property
    def embeddings(self) -> GoogleGenerativeAIEmbeddings:
        """Lazy-initialize embeddings to avoid startup failures."""
        if self._embeddings is None:
            self._embeddings = GoogleGenerativeAIEmbeddings(
                model=f"models/{settings.gemini_embedding_model}",
                google_api_key=settings.gemini_api_key,
            )
        return self._embeddings

    def _get_collection(self, workspace_id: str) -> Chroma:
        """Get or create a ChromaDB collection scoped to a workspace."""
        collection_name = f"workspace_{workspace_id.replace('-', '_')[:50]}"
        return Chroma(
            collection_name=collection_name,
            embedding_function=self.embeddings,
            persist_directory=settings.chroma_persist_dir,
        )

    async def add_document(
        self,
        workspace_id: str,
        document_id: str,
        text: str,
        metadata: Dict[str, Any],
    ) -> int:
        """
        Chunk a document, generate embeddings, and store in ChromaDB.
        Returns the number of chunks created.
        """
        try:
            # Split text into chunks
            chunks = self._text_splitter.split_text(text)

            if not chunks:
                logger.warning(f"No chunks generated for document {document_id}")
                return 0

            # Prepare metadata for each chunk
            metadatas = []
            ids = []
            for i, chunk in enumerate(chunks):
                chunk_meta = {
                    **metadata,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "workspace_id": workspace_id,
                }
                metadatas.append(chunk_meta)
                ids.append(f"{document_id}_chunk_{i}")

            # Store in ChromaDB
            vectorstore = self._get_collection(workspace_id)
            vectorstore.add_texts(
                texts=chunks,
                metadatas=metadatas,
                ids=ids,
            )

            logger.info(
                f"Indexed {len(chunks)} chunks for document {document_id} "
                f"in workspace {workspace_id}"
            )
            return len(chunks)

        except Exception as e:
            logger.error(f"RAG indexing failed for document {document_id}: {e}")
            raise

    async def query(
        self,
        workspace_id: str,
        question: str,
        k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search across a workspace's documents.
        Returns top-k relevant chunks with metadata.
        """
        try:
            vectorstore = self._get_collection(workspace_id)
            results = vectorstore.similarity_search_with_relevance_scores(
                query=question,
                k=k,
            )

            retrieved = []
            for doc, score in results:
                retrieved.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "relevance_score": round(score, 4),
                })

            logger.info(
                f"RAG query in workspace {workspace_id}: "
                f"'{question[:50]}...' → {len(retrieved)} results"
            )
            return retrieved

        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            return []

    async def get_context(
        self,
        workspace_id: str,
        question: str,
        k: int = 5,
    ) -> str:
        """
        Get formatted context string for LLM from relevant chunks.
        Used to build the prompt for Gemini.
        """
        results = await self.query(workspace_id, question, k)

        if not results:
            return "No relevant documents found in this workspace."

        context_parts = []
        for i, result in enumerate(results, 1):
            source = result["metadata"].get("filename", "Unknown")
            content = result["content"]
            score = result["relevance_score"]
            context_parts.append(
                f"[Source {i}: {source} (relevance: {score})]\n{content}"
            )

        return "\n\n---\n\n".join(context_parts)

    async def delete_document_chunks(self, workspace_id: str, document_id: str) -> None:
        """Remove all chunks for a document from the vector store."""
        try:
            vectorstore = self._get_collection(workspace_id)
            # Get the underlying collection to delete by metadata filter
            collection = vectorstore._collection
            collection.delete(where={"document_id": document_id})
            logger.info(f"Deleted chunks for document {document_id}")
        except Exception as e:
            logger.error(f"Failed to delete chunks for document {document_id}: {e}")


# Singleton instance
rag_service = RAGService()
