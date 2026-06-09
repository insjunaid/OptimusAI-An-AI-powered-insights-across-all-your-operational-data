"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquareText,
  Upload,
  FileText,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAuth } from "@/components/AuthProvider";

interface SidebarProps {
  workspaceId?: string;
  workspaceName?: string;
}

export default function Sidebar({ workspaceId, workspaceName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  const mainNav = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Workspaces",
      href: "/workspaces",
      icon: FolderKanban,
    },
  ];

  const workspaceNav = workspaceId
    ? [
        {
          label: "Files",
          href: `/workspaces/${workspaceId}`,
          icon: FileText,
        },
        {
          label: "Upload",
          href: `/workspaces/${workspaceId}/upload`,
          icon: Upload,
        },
        {
          label: "AI Chat",
          href: `/workspaces/${workspaceId}/chat`,
          icon: MessageSquareText,
        },
        {
          label: "Summarize",
          href: `/workspaces/${workspaceId}/summarize`,
          icon: Sparkles,
        },
      ]
    : [];

  const NavItem = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }) => {
    const isActive =
      pathname === href ||
      (href !== "/" && href !== "/dashboard" && pathname.startsWith(href));

    const item = (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-accent/60",
          isActive
            ? "bg-primary/15 text-primary border border-primary/20 shadow-sm shadow-primary/10"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon
          className={cn(
            "h-4.5 w-4.5 shrink-0",
            isActive ? "text-primary" : ""
          )}
        />
        {!collapsed && <span>{label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger render={item} />
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return item;
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-border/50 bg-sidebar transition-all duration-300 shrink-0",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/20 shrink-0">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">
              OptimusAI
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Ops Intelligence
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Main nav */}
        {!collapsed && (
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Platform
          </p>
        )}
        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {/* Workspace nav */}
        {workspaceNav.length > 0 && (
          <>
            <div className="my-4 border-t border-border/30" />
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {workspaceName || "Workspace"}
              </p>
            )}
            {workspaceNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-border/30 flex flex-col gap-2">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full p-2 rounded-lg bg-accent/20 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Admin User</span>
                <span className="text-[10px] text-muted-foreground">admin@optimus.ai</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger render={
              <Button variant="ghost" size="icon" onClick={logout} className="w-full text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
                <LogOut className="h-5 w-5" />
              </Button>
            } />
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
