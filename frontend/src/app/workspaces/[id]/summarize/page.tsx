"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Brain,
  BarChart3,
  Shield,
} from "lucide-react";
import {
  getWorkspace,
  getFiles,
  summarizeWorkspace,
  summarizeDocument,
  getSummaries,
  type Workspace,
  type Document,
  type Summary,
} from "@/lib/api";

const summaryTypes = [
  {
    value: "operational",
    label: "Operational",
    description: "Executive overview with metrics and risks",
    icon: BarChart3,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    value: "incident",
    label: "Incident",
    description: "Root cause analysis and impact assessment",
    icon: AlertTriangle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    value: "workspace",
    label: "Full Analysis",
    description: "Comprehensive analysis of all workspace data",
    icon: Brain,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
];

export default function SummarizePage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedType, setSelectedType] = useState("operational");
  const [error, setError] = useState("");
  const [docSummarizing, setDocSummarizing] = useState<string | null>(null);
  const [docSummaries, setDocSummaries] = useState<Record<string, Summary>>({});
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isWorkspaceSummaryOpen, setIsWorkspaceSummaryOpen] = useState(true);

  useEffect(() => {
    Promise.all([
      getWorkspace(workspaceId), 
      getFiles(workspaceId),
      getSummaries(workspaceId)
    ])
      .then(([ws, files, summaries]) => {
        setWorkspace(ws);
        setDocuments(files.documents);
        
        // Find latest workspace summary if any
        const latestWorkspaceSummary = summaries.find(s => !s.document_id);
        if (latestWorkspaceSummary) {
          setSummary(latestWorkspaceSummary);
          setSelectedType(latestWorkspaceSummary.summary_type);
        }

        // Map document summaries
        const docSums: Record<string, Summary> = {};
        summaries.forEach(s => {
          if (s.document_id && !docSums[s.document_id]) {
            docSums[s.document_id] = s;
          }
        });
        setDocSummaries(docSums);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleWorkspaceSummarize = async () => {
    setSummarizing(true);
    setError("");
    setSummary(null);
    try {
      const result = await summarizeWorkspace(workspaceId, selectedType);
      setSummary(result);
      setIsWorkspaceSummaryOpen(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Summarization failed";
      setError(msg);
    } finally {
      setSummarizing(false);
    }
  };

  const handleDocSummarize = async (docId: string) => {
    setDocSummarizing(docId);
    try {
      const result = await summarizeDocument(docId, "document");
      setDocSummaries((prev) => ({ ...prev, [docId]: result }));
      setExpandedDoc(docId);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setDocSummarizing(null);
    }
  };

  const handleCopy = () => {
    if (summary?.content) {
      navigator.clipboard.writeText(summary.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                AI Summarization
              </h1>
              <p className="text-sm text-muted-foreground">
                Generate AI-powered insights and summaries from your data
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6 max-w-5xl">
          {/* Summary Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspace Summary</CardTitle>
              <CardDescription>
                Generate an AI summary across all {documents.length} document
                {documents.length !== 1 ? "s" : ""} in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {summaryTypes.map((st) => {
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.value}
                      onClick={() => setSelectedType(st.value)}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                        selectedType === st.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/50 hover:border-border hover:bg-accent/20"
                      }`}
                    >
                      <div
                        className={`h-9 w-9 rounded-lg ${st.bg} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <Icon className={`h-4.5 w-4.5 ${st.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{st.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {st.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    Upload documents first to generate summaries
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleWorkspaceSummarize}
                  disabled={summarizing}
                  className="w-full gap-2"
                  size="lg"
                >
                  {summarizing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing {documents.length} document
                      {documents.length > 1 ? "s" : ""}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate{" "}
                      {summaryTypes.find((s) => s.value === selectedType)
                        ?.label || ""}
                      {" "}Summary
                    </>
                  )}
                </Button>
              )}

              {error && (
                <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <p className="text-sm text-destructive font-medium">
                    Summarization Failed
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Result */}
          {summary && (
            <Card className="animate-fade-in">
              <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => setIsWorkspaceSummaryOpen(!isWorkspaceSummaryOpen)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <CardTitle className="text-lg">
                      AI-Generated Summary
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {summary.summary_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setIsWorkspaceSummaryOpen(!isWorkspaceSummaryOpen); }}
                      className="gap-1.5 text-xs"
                    >
                      {isWorkspaceSummaryOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {isWorkspaceSummaryOpen ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                      className="gap-1.5 text-xs"
                    >
                      <ClipboardCopy className="h-3.5 w-3.5" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isWorkspaceSummaryOpen && (
                <CardContent>
                <div className="max-h-[600px] overflow-y-auto pr-4">
                  <div className="prose-chat text-sm">
                    <ReactMarkdown>{summary.content}</ReactMarkdown>
                  </div>
                </div>

                {/* Key Issues */}
                {summary.key_issues && summary.key_issues.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-amber-400" />
                        Key Issues Identified ({summary.key_issues.length})
                      </h3>
                      <div className="space-y-2">
                        {summary.key_issues.map((issue, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-sm text-foreground/90">
                              {issue}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              )}
            </Card>
          )}

          {/* Per-Document Summaries */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Document-Level Summaries
                </CardTitle>
                <CardDescription>
                  Generate individual summaries for each document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents
                    .filter((d) => d.status === "ready")
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-border/30 rounded-lg overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-3 hover:bg-accent/20 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {doc.original_filename}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                  variant="outline"
                                  className="text-[9px] uppercase"
                                >
                                  {doc.file_type}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {doc.chunk_count} chunks
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {docSummaries[doc.id] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs"
                                onClick={() =>
                                  setExpandedDoc(
                                    expandedDoc === doc.id ? null : doc.id
                                  )
                                }
                              >
                                {expandedDoc === doc.id ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                                {expandedDoc === doc.id ? "Hide" : "Show"}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs"
                              disabled={docSummarizing === doc.id}
                              onClick={() => handleDocSummarize(doc.id)}
                            >
                              {docSummarizing === doc.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Analyzing...
                                </>
                              ) : docSummaries[doc.id] ? (
                                <>
                                  <RefreshCw className="h-3 w-3" />
                                  Redo
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3 w-3" />
                                  Summarize
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Summary */}
                        {expandedDoc === doc.id && docSummaries[doc.id] && (
                          <div className="border-t border-border/20 p-4 bg-accent/5 animate-fade-in">
                            <div className="prose-chat text-sm">
                              <ReactMarkdown>
                                {docSummaries[doc.id].content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
