"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  MessageSquareText,
  Sparkles,
  Trash2,
  Eye,
  Clock,
  HardDrive,
} from "lucide-react";
import {
  getWorkspace,
  getFiles,
  deleteFile,
  type Workspace,
  type Document,
} from "@/lib/api";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const fileTypeColors: Record<string, string> = {
  pdf: "text-rose-400 bg-rose-500/10",
  txt: "text-slate-400 bg-slate-500/10",
  csv: "text-emerald-400 bg-emerald-500/10",
  json: "text-amber-400 bg-amber-500/10",
  log: "text-orange-400 bg-orange-500/10",
  png: "text-blue-400 bg-blue-500/10",
  jpg: "text-blue-400 bg-blue-500/10",
  jpeg: "text-blue-400 bg-blue-500/10",
};

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ws, files] = await Promise.all([
        getWorkspace(workspaceId),
        getFiles(workspaceId),
      ]);
      setWorkspace(ws);
      setDocuments(files.documents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      await deleteFile(docId);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full">
        <Sidebar workspaceId={workspaceId} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        workspaceId={workspaceId}
        workspaceName={workspace?.name}
      />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {workspace?.workspace_type}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {workspace?.name}
              </h1>
              {workspace?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {workspace.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/workspaces/${workspaceId}/upload`}>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Files
                </Button>
              </Link>
              <Link href={`/workspaces/${workspaceId}/chat`}>
                <Button className="gap-2">
                  <MessageSquareText className="h-4 w-4" />
                  AI Chat
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href={`/workspaces/${workspaceId}/upload`}>
              <Card className="group hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Upload Data</p>
                    <p className="text-xs text-muted-foreground">
                      PDF, TXT, CSV, images...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/workspaces/${workspaceId}/chat`}>
              <Card className="group hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquareText className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ask AI</p>
                    <p className="text-xs text-muted-foreground">
                      Query your data with AI
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/workspaces/${workspaceId}/summarize`}>
              <Card className="group hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Summarize</p>
                    <p className="text-xs text-muted-foreground">
                      AI-generated insights
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Files List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Files ({documents.length})
                  </CardTitle>
                  <CardDescription>
                    All documents uploaded to this workspace
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <h3 className="text-sm font-medium mb-1">No files yet</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload documents to start analyzing with AI
                  </p>
                  <Link href={`/workspaces/${workspaceId}/upload`}>
                    <Button size="sm" className="gap-2">
                      <Upload className="h-3.5 w-3.5" /> Upload Files
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => {
                    const colors =
                      fileTypeColors[doc.file_type] ||
                      "text-slate-400 bg-slate-500/10";
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${colors}`}
                          >
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {doc.original_filename}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {formatFileSize(doc.file_size)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(doc.created_at)}
                              </span>
                              {doc.chunk_count > 0 && (
                                <span>{doc.chunk_count} chunks</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={
                              doc.status === "ready"
                                ? "default"
                                : doc.status === "error"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {doc.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {doc.file_type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
