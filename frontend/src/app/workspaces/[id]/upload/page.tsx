"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Sidebar from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import { uploadFile } from "@/lib/api";

interface UploadItem {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
  progress: number;
}

const fileIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5 text-rose-400" />,
  csv: <FileSpreadsheet className="h-5 w-5 text-emerald-400" />,
  json: <FileJson className="h-5 w-5 text-amber-400" />,
  png: <ImageIcon className="h-5 w-5 text-blue-400" />,
  jpg: <ImageIcon className="h-5 w-5 text-blue-400" />,
  jpeg: <ImageIcon className="h-5 w-5 text-blue-400" />,
};

export default function UploadPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newUploads: UploadItem[] = acceptedFiles.map((file) => ({
        file,
        status: "pending" as const,
        progress: 0,
      }));

      setUploads((prev) => [...newUploads, ...prev]);
      setUploading(true);

      for (let i = 0; i < newUploads.length; i++) {
        const item = newUploads[i];

        setUploads((prev) =>
          prev.map((u) =>
            u.file === item.file
              ? { ...u, status: "uploading", progress: 30 }
              : u
          )
        );

        try {
          const result = await uploadFile(workspaceId, item.file);

          setUploads((prev) =>
            prev.map((u) =>
              u.file === item.file
                ? {
                    ...u,
                    status: "success",
                    progress: 100,
                    message: result.message,
                  }
                : u
            )
          );
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : "Upload failed";
          setUploads((prev) =>
            prev.map((u) =>
              u.file === item.file
                ? {
                    ...u,
                    status: "error",
                    progress: 100,
                    message: errorMessage,
                  }
                : u
            )
          );
        }
      }
      setUploading(false);
    },
    [workspaceId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt", ".log"],
      "text/csv": [".csv"],
      "application/json": [".json"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const getFileExt = (name: string) =>
    name.split(".").pop()?.toLowerCase() || "";

  return (
    <div className="flex h-screen w-full">
      <Sidebar workspaceId={workspaceId} />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border/50 px-8 py-6">
          <h1 className="text-2xl font-bold tracking-tight">Upload Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload documents and images for AI analysis
          </p>
        </div>

        <div className="px-8 py-6 space-y-6 max-w-4xl">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border/50 hover:border-primary/50 hover:bg-accent/20"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div
                className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all ${
                  isDragActive
                    ? "bg-primary/20 scale-110"
                    : "bg-accent/40"
                }`}
              >
                <Upload
                  className={`h-8 w-8 ${
                    isDragActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div>
                <p className="text-base font-medium">
                  {isDragActive
                    ? "Drop files here..."
                    : "Drag & drop files, or click to browse"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports PDF, TXT, CSV, JSON, LOG, PNG, JPG, JPEG (max 50MB)
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {["PDF", "TXT", "CSV", "JSON", "LOG", "PNG", "JPG"].map(
                  (ext) => (
                    <Badge
                      key={ext}
                      variant="outline"
                      className="text-[10px]"
                    >
                      .{ext.toLowerCase()}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Pipeline info */}
          <Card className="bg-accent/10 border-border/30">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">
                🔄 What happens after upload:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                    1
                  </div>
                  Parse & Extract Text
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                    2
                  </div>
                  Split into Chunks
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                    3
                  </div>
                  Generate Embeddings
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                    4
                  </div>
                  Ready for AI Chat
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {uploads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Progress</CardTitle>
                <CardDescription>
                  {uploads.filter((u) => u.status === "success").length} of{" "}
                  {uploads.length} complete
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploads.map((item, i) => {
                    const ext = getFileExt(item.file.name);
                    return (
                      <div
                        key={`${item.file.name}-${i}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-accent/10"
                      >
                        <div className="shrink-0">
                          {fileIcons[ext] || (
                            <FileText className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress
                              value={item.progress}
                              className="h-1.5 flex-1"
                            />
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {item.status === "uploading" && (
                                <span className="flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Processing...
                                </span>
                              )}
                              {item.status === "success" && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Done
                                </span>
                              )}
                              {item.status === "error" && (
                                <span className="flex items-center gap-1 text-destructive">
                                  <AlertCircle className="h-3 w-3" />
                                  Failed
                                </span>
                              )}
                              {item.status === "pending" && "Waiting..."}
                            </span>
                          </div>
                          {item.message && item.status === "error" && (
                            <p className="text-[10px] text-destructive/80 mt-1">
                              {item.message}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
