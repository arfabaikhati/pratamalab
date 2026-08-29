"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useWorkspaceStore } from "@/store/workspace";
import { cn, getInitials, avatarColor, PAGE_TYPE_ICONS, formatDate } from "@/lib/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type { Page } from "@/types";
import {
  ChevronDown, ChevronRight, Plus, Trash2, Star, Archive,
  Settings, LogOut, Search, Home, FileText, Users,
} from "lucide-react";

// ── PageItem ──────────────────────────────────────────────────────────────────
function PageItem({
  page,
  depth = 0,
  workspaceId,
}: {
  page: Page;
  depth?: number;
  workspaceId: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const isActive = pathname.includes(`/page/${page.id}`);
  const { addPage, removePage } = useWorkspaceStore();

  const hasChildren = page.children && page.children.length > 0;

  async function createSubPage() {
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/pages`, {
        parent_id: page.id,
        title: "Untitled",
      });
      addPage(data);
      setExpanded(true);
    } catch {
      toast.error("Failed to create page");
    }
  }

  async function deletePage() {
    try {
      await api.delete(`/workspaces/${workspaceId}/pages/${page.id}`);
      removePage(page.id);
      toast.success("Page deleted");
    } catch {
      toast.error("Failed to delete page");
    }
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors",
          isActive && "bg-[var(--bg-hover)]"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 text-secondary rounded hover:bg-[var(--border)]"
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <span className="w-3" />
          )}
        </button>

        {/* Icon + Title */}
        <Link
          href={`/workspace/${workspaceId}/page/${page.id}`}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          <span className="text-sm leading-none">
            {page.icon ?? PAGE_TYPE_ICONS[page.type] ?? "📄"}
          </span>
          <span className="text-sm truncate">
            {page.title || "Untitled"}
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            onClick={createSubPage}
            title="Add sub-page"
            className="p-0.5 rounded hover:bg-[var(--border)] text-secondary"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={deletePage}
            title="Delete"
            className="p-0.5 rounded hover:bg-red-100 text-secondary hover:text-red-500"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {page.children!.map((child) => (
            <PageItem key={child.id} page={child} depth={depth + 1} workspaceId={workspaceId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ workspaceId }: { workspaceId: number }) {
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const workspace = useAuthStore((s) => s.workspace);
  const logout    = useAuthStore((s) => s.logout);
  const pages     = useWorkspaceStore((s) => s.pages);
  const addPage   = useWorkspaceStore((s) => s.addPage);
  const [showTrash, setShowTrash] = useState(false);

  async function createPage() {
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/pages`, {
        title: "Untitled",
        type: "document",
      });
      addPage(data);
      router.push(`/workspace/${workspaceId}/page/${data.id}`);
    } catch {
      toast.error("Failed to create page");
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const rootPages = pages.filter((p) => p.parent_id === null && !p.is_archived);
  const favPages  = pages.filter((p) => p.is_favorite && !p.is_archived);

  return (
    <aside
      className="flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border)]"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Workspace header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-brand-600 text-white text-sm font-bold flex-shrink-0">
          {workspace?.icon ?? workspace?.name?.[0] ?? "P"}
        </div>
        <span className="text-sm font-semibold truncate flex-1">
          {workspace?.name ?? "PratamaLab"}
        </span>
        <button className="p-1 rounded hover:bg-[var(--bg-hover)] text-secondary">
          <Settings size={14} />
        </button>
      </div>

      {/* Quick actions */}
      <div className="px-2 py-2 space-y-0.5">
        <NavItem icon={<Search size={14} />} label="Search" onClick={() => {}} />
        <NavItem icon={<Home size={14} />}   label="Home"   href={`/workspace/${workspaceId}`} />
        <NavItem icon={<Users size={14} />}  label="Members" href={`/workspace/${workspaceId}/members`} />
      </div>

      <div className="h-px bg-[var(--border)] mx-3 my-1" />

      {/* Favorites */}
      {favPages.length > 0 && (
        <>
          <div className="px-3 py-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide flex items-center gap-1">
              <Star size={10} /> Favorites
            </p>
          </div>
          {favPages.map((p) => (
            <PageItem key={p.id} page={p} workspaceId={workspaceId} />
          ))}
          <div className="h-px bg-[var(--border)] mx-3 my-1" />
        </>
      )}

      {/* Pages */}
      <div className="flex items-center justify-between px-3 py-1">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Pages</p>
        <button
          onClick={createPage}
          className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-secondary"
          title="New page"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-2">
        {rootPages.length === 0 ? (
          <button
            onClick={createPage}
            className="w-full text-left px-3 py-2 text-sm text-secondary hover:text-[var(--text)] hover:bg-[var(--bg-hover)] rounded-md transition"
          >
            + New page
          </button>
        ) : (
          rootPages.map((p) => (
            <PageItem key={p.id} page={p} workspaceId={workspaceId} />
          ))
        )}
      </div>

      {/* Trash */}
      <div className="border-t border-[var(--border)] px-2 py-2">
        <button
          onClick={() => setShowTrash(!showTrash)}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-secondary hover:bg-[var(--bg-hover)] transition"
        >
          <Archive size={14} />
          <span>Trash</span>
        </button>
      </div>

      {/* User footer */}
      <div className="border-t border-[var(--border)] px-3 py-2.5 flex items-center gap-2">
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0",
            avatarColor(user?.id ?? 0)
          )}
        >
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(user?.name ?? "U")
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-secondary truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-1 rounded hover:bg-[var(--bg-hover)] text-secondary"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  icon, label, href, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = href ? pathname === href : false;
  const cls = cn(
    "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition w-full text-left",
    isActive ? "bg-[var(--bg-hover)] font-medium" : "text-secondary hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
  );

  if (href) return (
    <Link href={href} className={cls}>{icon}{label}</Link>
  );
  return (
    <button onClick={onClick} className={cls}>{icon}{label}</button>
  );
}
