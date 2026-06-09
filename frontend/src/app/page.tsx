"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Zap, Shield, BarChart3, Database, FileSearch } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white overflow-hidden flex flex-col relative selection:bg-primary/30">
      
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 relative z-10 backdrop-blur-md bg-[#09090b]/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">OptimusAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-white">Sign In</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 text-center mt-20 mb-32">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">v1.0 Now Live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
          The Ultimate <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-emerald-400">
            Operations Intelligence
          </span> Platform
        </h1>
        
        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl animate-fade-in leading-relaxed" style={{ animationDelay: "200ms" }}>
          Stop wasting hours digging through logs and incident reports. OptimusAI connects to your entire infrastructure and gives you instant, AI-powered answers to your most complex operational questions.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <Link href="/login">
            <Button size="lg" className="h-14 px-8 text-lg bg-primary text-primary-foreground shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary),0.6)] hover:scale-105 transition-all duration-300">
              Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full animate-fade-in" style={{ animationDelay: "500ms" }}>
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left group">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Database className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Vector Similarity Search</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload your documents and let our ChromaDB vector engine mathematically index them for lightning-fast retrieval.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left group">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Brain className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">RAG-Powered AI</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Leverage state-of-the-art LLMs to read your context and generate accurate, human-readable answers instantly.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left group">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileSearch className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Summarization</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Instantly generate executive summaries of post-mortems and infrastructure guides to save hours of manual reading.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
