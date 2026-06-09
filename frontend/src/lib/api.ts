/**
 * API Client — typed functions for all backend endpoints.
 * Centralized HTTP layer with error handling.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ─── Types ───────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  workspace_type: string;
  created_at: string;
  updated_at: string;
  document_count: number;
  chat_count: number;
}

export interface Document {
  id: string;
  workspace_id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  content_preview: string | null;
  status: string;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
}

export interface SourceReference {
  document: string;
  chunk: string;
  relevance: number;
}

export interface ChatMessage {
  id: string;
  query: string;
  response: string;
  sources: SourceReference[];
  created_at: string;
}

export interface Summary {
  id: string;
  workspace_id: string;
  document_id: string | null;
  summary_type: string;
  content: string;
  key_issues: string[] | null;
  created_at: string;
}

export interface DashboardData {
  total_workspaces: number;
  total_documents: number;
  total_chats: number;
  total_summaries: number;
  recent_uploads: {
    id: string;
    filename: string;
    workspace_name: string;
    file_type: string;
    status: string;
    created_at: string;
  }[];
  recent_queries: {
    id: string;
    query: string;
    workspace_name: string;
    created_at: string;
  }[];
  insights: {
    title: string;
    description: string;
    type: string;
  }[];
}

// ─── Helpers ─────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json();
}

// ─── Workspace API ───────────────────────────────────────

export async function createWorkspace(data: {
  name: string;
  description?: string;
  workspace_type: string;
}): Promise<Workspace> {
  return apiFetch("/workspaces", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getWorkspaces(): Promise<{
  workspaces: Workspace[];
  total: number;
}> {
  return apiFetch("/workspaces");
}

export async function getWorkspace(id: string): Promise<Workspace> {
  return apiFetch(`/workspaces/${id}`);
}

export async function deleteWorkspace(id: string): Promise<void> {
  return apiFetch(`/workspaces/${id}`, { method: "DELETE" });
}

// ─── Document API ────────────────────────────────────────

export async function uploadFile(
  workspaceId: string,
  file: File
): Promise<{ message: string; document: Document }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch(`/workspaces/${workspaceId}/upload`, {
    method: "POST",
    body: formData,
  });
}

export async function getFiles(
  workspaceId: string
): Promise<{ documents: Document[]; total: number }> {
  return apiFetch(`/workspaces/${workspaceId}/files`);
}

export async function deleteFile(documentId: string): Promise<void> {
  return apiFetch(`/files/${documentId}`, { method: "DELETE" });
}

// ─── Chat API ────────────────────────────────────────────

export async function sendChatMessage(
  workspaceId: string,
  query: string
): Promise<ChatMessage> {
  return apiFetch(`/workspaces/${workspaceId}/chat`, {
    method: "POST",
    body: JSON.stringify({ query, include_sources: true }),
  });
}

export async function getChatHistory(
  workspaceId: string
): Promise<{ messages: ChatMessage[]; total: number }> {
  return apiFetch(`/workspaces/${workspaceId}/chat/history`);
}

// ─── Summary API ─────────────────────────────────────────

export async function summarizeWorkspace(
  workspaceId: string,
  summaryType: string = "operational"
): Promise<Summary> {
  return apiFetch(`/workspaces/${workspaceId}/summarize`, {
    method: "POST",
    body: JSON.stringify({ summary_type: summaryType }),
  });
}

export async function summarizeDocument(
  documentId: string,
  summaryType: string = "document"
): Promise<Summary> {
  return apiFetch(`/documents/${documentId}/summarize`, {
    method: "POST",
    body: JSON.stringify({ summary_type: summaryType }),
  });
}

export async function getSummaries(
  workspaceId: string
): Promise<Summary[]> {
  return apiFetch(`/workspaces/${workspaceId}/summaries`);
}

// ─── Dashboard API ───────────────────────────────────────

export async function getDashboard(): Promise<DashboardData> {
  return apiFetch("/dashboard");
}

// ─── Health API ──────────────────────────────────────────

export async function healthCheck(): Promise<{
  status: string;
  platform: string;
  version: string;
}> {
  return apiFetch("/health");
}
