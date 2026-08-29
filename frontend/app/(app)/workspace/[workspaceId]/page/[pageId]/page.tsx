"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useWorkspaceStore } from "@/store/workspace";
import { getEcho } from "@/lib/echo";
import type { OnlineUser, Page } from "@/types";
import PageHeader from "@/components/PageHeader";
import toast from "react-hot-toast";

// Dynamic import to avoid SSR issues with BlockNote
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function PageEditorPage() {
  const params      = useParams();
  const workspaceId = parseInt(params.workspaceId as string);
  const pageId      = parseInt(params.pageId as string);

  const token      = useAuthStore((s) => s.token);
  const updatePage = useWorkspaceStore((s) => s.updatePage);

  const [page, setPage]             = useState<Page | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading]       = useState(true);

  // ── Fetch page data ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchPage() {
      try {
        const { data } = await api.get<Page>(
          `/workspaces/${workspaceId}/pages/${pageId}`
        );
        setPage(data);
      } catch {
        toast.error("Page not found");
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, [workspaceId, pageId]);

  // ── Real-time: join page presence channel ────────────────────────────────
  useEffect(() => {
    if (!token || !page?.uuid) return;

    const echo = getEcho(token);
    const channel = echo.join(`page.${page.uuid}`)
      .here((users: OnlineUser[]) => setOnlineUsers(users))
      .joining((user: OnlineUser) => {
        setOnlineUsers((prev) => [...prev.filter((u) => u.id !== user.id), user]);
      })
      .leaving((user: OnlineUser) => {
        setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
      })
      .listen(".page.updated", (e: { title: string; icon: string }) => {
        setPage((prev) => prev ? { ...prev, title: e.title, icon: e.icon } : prev);
      });

    return () => {
      echo.leave(`page.${page.uuid}`);
    };
  }, [token, page?.uuid]);

  // ── Title update (debounced) ─────────────────────────────────────────────
  const handleTitleChange = useCallback(
    async (title: string) => {
      if (!page) return;
      setPage((prev) => prev ? { ...prev, title } : prev);
      updatePage(pageId, { title });

      try {
        await api.patch(`/workspaces/${workspaceId}/pages/${pageId}`, { title });
      } catch { /* silent */ }
    },
    [page, workspaceId, pageId, updatePage]
  );

  const handleIconChange = useCallback(
    async (icon: string) => {
      if (!page) return;
      setPage((prev) => prev ? { ...prev, icon } : prev);
      updatePage(pageId, { icon });
      try {
        await api.patch(`/workspaces/${workspaceId}/pages/${pageId}`, { icon });
      } catch { /* silent */ }
    },
    [page, workspaceId, pageId, updatePage]
  );

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-secondary">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading page…</span>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-secondary">
        <p>Page not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        page={page}
        onTitleChange={handleTitleChange}
        onIconChange={handleIconChange}
        onCoverChange={() => {}}
        onlineUsers={onlineUsers}
      />

      <Editor
        workspaceId={workspaceId}
        pageId={pageId}
        pageUuid={page.uuid}
        isLocked={page.is_locked}
      />
    </div>
  );
}
