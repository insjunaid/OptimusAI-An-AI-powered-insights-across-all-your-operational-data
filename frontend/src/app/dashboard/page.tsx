"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  FileText,
  MessageSquareText,
  Sparkles,
  ArrowRight,
  Clock,
  Brain,
  AlertCircle,
  CheckCircle2,
  Info,
  Lightbulb,
} from "lucide-react";
import { getDashboard, type DashboardData } from "@/lib/api";

const insightIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-400" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-400" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  action: <Lightbulb className="h-4 w-4 text-violet-400" />,
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        {
          label: "Workspaces",
          value: data.total_workspaces,
          icon: FolderKanban,
          color: "text-violet-400",
          bg: "bg-violet-500/10",
        },
        {
          label: "Documents",
          value: data.total_documents,
          icon: FileText,
          color: "text-cyan-400",
          bg: "bg-cyan-500/10",
        },
        {
          label: "AI Queries",
          value: data.total_chats,
          icon: MessageSquareText,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
        },
        {
          label: "Summaries",
          value: data.total_summaries,
          icon: Sparkles,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
        },
      ]
    : [];

  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border/50 px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Live Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Operations Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered insights across all your operational data
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Error state */}
          {error && (
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
              <p className="font-medium">Connection Error</p>
              <p className="mt-1 text-destructive/80">{error}</p>
              <p className="mt-2 text-xs text-destructive/60">
                Make sure the backend is running at http://localhost:8000
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))
              : stats.map((stat) => (
                  <Card
                    key={stat.label}
                    className="group hover:border-primary/30 transition-all duration-300 animate-fade-in"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {stat.label}
                          </p>
                          <p className="text-3xl font-bold mt-1 tracking-tight">
                            {stat.value}
                          </p>
                        </div>
                        <div
                          className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                        >
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Uploads */}
            <Card className="lg:col-span-2 animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Recent Uploads
                    </CardTitle>
                    <CardDescription>Latest files added to the platform</CardDescription>
                  </div>
                  <Link
                    href="/workspaces"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {!data || data.recent_uploads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No files uploaded yet</p>
                    <Link
                      href="/workspaces"
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      Create a workspace to get started
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.recent_uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {upload.filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {upload.workspace_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={
                              upload.status === "ready"
                                ? "default"
                                : upload.status === "error"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {upload.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {upload.file_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Insights
                </CardTitle>
                <CardDescription>Platform intelligence</CardDescription>
              </CardHeader>
              <CardContent>
                {!data || data.insights.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Insights will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.insights.map((insight, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          {insightIcons[insight.type] || insightIcons.info}
                          <span className="text-sm font-medium">
                            {insight.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Queries */}
          {data && data.recent_queries.length > 0 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                  Recent AI Queries
                </CardTitle>
                <CardDescription>Latest questions asked across workspaces</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recent_queries.map((query) => (
                    <div
                      key={query.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Brain className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm truncate">{query.query}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {query.workspace_name}
                      </Badge>
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
