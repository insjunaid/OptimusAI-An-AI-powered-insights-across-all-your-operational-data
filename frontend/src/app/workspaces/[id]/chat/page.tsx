"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, FileText, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { sendChatMessage, getChatHistory, getWorkspace, type ChatMessage, type Workspace } from "@/lib/api";

export default function ChatPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    Promise.all([getWorkspace(workspaceId), getChatHistory(workspaceId)])
      .then(([ws, history]) => { setWorkspace(ws); setMessages(history.messages); })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || loading) return;
    setInput("");
    setLoading(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = { id: tempId, query, response: "", sources: [], created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const response = await sendChatMessage(workspaceId, query);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? response : m)));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, response: `❌ Error: ${msg}` } : m));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const suggestions = [
    "What are the key issues in my data?",
    "Summarize the most recent incidents",
    "Are there any recurring problems?",
    "What actions should I prioritize?",
  ];

  return (
    <div className="flex h-screen w-full">
      <Sidebar workspaceId={workspaceId} workspaceName={workspace?.name} />
      <main className="flex-1 flex flex-col h-screen">
        <div className="border-b border-border/50 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Chat</h1>
              <p className="text-xs text-muted-foreground">Ask questions about your uploaded data • RAG-powered</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          {historyLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 animate-pulse-glow">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Ask anything about your data</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-8">I can analyze documents, find patterns, summarize incidents, and provide insights.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                    className="text-left p-3 rounded-lg border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-accent/20 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto pb-4">
              {messages.map((msg) => (<MessageBubble key={msg.id} message={msg} isLoading={loading && msg.response === ""} />))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border/50 px-6 py-4 shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <Textarea ref={textareaRef} placeholder="Ask a question about your data..." value={input}
              onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={2}
              className="pr-14 resize-none bg-accent/30 border-border/30 focus:border-primary/50" />
            <Button size="icon" className="absolute right-2 bottom-2 h-8 w-8" onClick={handleSend} disabled={!input.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
            AI responses are based on your uploaded documents via RAG. Always verify critical information.
          </p>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message, isLoading }: { message: ChatMessage; isLoading: boolean }) {
  const [showSources, setShowSources] = useState(false);
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[75%] bg-primary/15 border border-primary/20 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm whitespace-pre-wrap">{message.query}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="max-w-[85%] space-y-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />Analyzing your data...
            </div>
          ) : (
            <>
              <div className="bg-card border border-border/30 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="prose-chat text-sm"><ReactMarkdown>{message.response}</ReactMarkdown></div>
              </div>
              {message.sources && message.sources.length > 0 && (
                <div>
                  <button onClick={() => setShowSources(!showSources)}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    <FileText className="h-3 w-3" />{message.sources.length} source{message.sources.length > 1 ? "s" : ""} referenced
                    {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {showSources && (
                    <div className="mt-2 space-y-2">
                      {message.sources.map((src, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-accent/20 border border-border/20 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[9px]">{src.document}</Badge>
                            <span className="text-muted-foreground">relevance: {(src.relevance * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-muted-foreground line-clamp-3">{src.chunk}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
