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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  FolderKanban,
  FileText,
  MessageSquareText,
  ArrowRight,
  Wrench,
  AlertTriangle,
  Headphones,
  FlaskConical,
  Layers,
  Trash2,
} from "lucide-react";
import {
  getWorkspaces,
  createWorkspace,
  deleteWorkspace,
  type Workspace,
} from "@/lib/api";

const typeConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  engineering: { icon: Wrench, color: "text-blue-400", bg: "bg-blue-500/10" },
  incident: { icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10" },
  support: { icon: Headphones, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  research: { icon: FlaskConical, color: "text-amber-400", bg: "bg-amber-500/10" },
  custom: { icon: Layers, color: "text-violet-400", bg: "bg-violet-500/10" },
};

const workspaceTypes = [
  { value: "engineering", label: "Engineering" },
  { value: "incident", label: "Incident" },
  { value: "support", label: "Support" },
  { value: "research", label: "Research" },
  { value: "custom", label: "Custom" },
];

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("engineering");

  const fetchWorkspaces = () => {
    getWorkspaces()
      .then((res) => setWorkspaces(res.workspaces))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
        workspace_type: type,
      });
      setName("");
      setDescription("");
      setType("engineering");
      setDialogOpen(false);
      fetchWorkspaces();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this workspace and all its data?")) return;
    try {
      await deleteWorkspace(id);
      fetchWorkspaces();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border/50 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organize your operational data into workspaces
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
                render={<Button className="gap-2" />}
              >
                <Plus className="h-4 w-4" />
                New Workspace
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Workspace</DialogTitle>
                <DialogDescription>
                  Create a new workspace to organize operational data.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Name
                  </label>
                  <Input
                    placeholder="e.g., Production Incidents Q4"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Description{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <Textarea
                    placeholder="What kind of data will this workspace contain?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {workspaceTypes.map((t) => {
                      const cfg = typeConfig[t.value];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setType(t.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                            type === t.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                >
                  {creating ? "Creating..." : "Create Workspace"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="px-8 py-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-28 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-20">
              <FolderKanban className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first workspace to start organizing data
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Create Workspace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws) => {
                const cfg = typeConfig[ws.workspace_type] || typeConfig.custom;
                const Icon = cfg.icon;
                return (
                  <Link key={ws.id} href={`/workspaces/${ws.id}`}>
                    <Card className="group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer h-full animate-fade-in">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div
                            className={`h-10 w-10 rounded-xl ${cfg.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                          >
                            <Icon className={`h-5 w-5 ${cfg.color}`} />
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] capitalize"
                            >
                              {ws.workspace_type}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDelete(ws.id, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <CardTitle className="text-base mt-3 flex items-center justify-between">
                          <span>{ws.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {new Date(ws.created_at).toLocaleDateString()}
                          </span>
                        </CardTitle>
                        {ws.description && (
                          <CardDescription className="line-clamp-2 text-xs mt-1">
                            {ws.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {ws.document_count} files
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquareText className="h-3 w-3" />
                            {ws.chat_count} queries
                          </span>
                        </div>
                        <div className="mt-3 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Open workspace{" "}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
