"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useWorkspaceStore } from "@/store/workspace";
import { getEcho, disconnectEcho } from "@/lib/echo";
import type { OnlineUser, Page } from "@/types";
import PageHeader from "@/components/PageHeader";
import toast from "react-hot-toast";

// Lazy-load editor — avoids SSR issues with BlockNote/Mantine
const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function PageEditorPage() {
  const params      = useParams();
  const workspaceId = parseInt(params.workspaceId as string);
  const pageId      = parseInt(params.pageId as string);

  const token      = useAuthStore((s) => s.token);
  const updatePage = useWorkspaceStore((s) => s.updatePage);

  const [page, setPage]               = useState<Page | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading]         = useState(true);

  // Debounce ref for title PATCH — prevents spamming the API on every keystroke
  const titleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch page ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setPage(null);
    setOnlineUsers([]);

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

  // ── Real-time presence channel ─────────────────────────────────────────────
  useEffect(() => {
    if (!token || !page?.uuid) return;

    let mounted = true;

    try {
      const echo    = getEcho(token);
      const channel = echo
        .join(`page.${page.uuid}`)
        .here((users: OnlineUser[]) => {
          if (mounted) setOnlineUsers(users);
        })
        .joining((user: OnlineUser) => {
          if (mounted)
            setOnlineUsers((prev) => [
              ...prev.filter((u) => u.id !== user.id),
              user,
            ]);
        })
        .leaving((user: OnlineUser) => {
          if (mounted)
            setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
        })
        .listen(
          ".page.updated",
          (e: { title: string; icon: string }) => {
            if (mounted)
              setPage((prev) =>
                prev ? { ...prev, title: e.title, icon: e.icon } : prev
              );
          }
        );

      void channel; // suppress unused-variable warning

      return () => {
        mounted = false;
        try { echo.leave(`page.${page.uuid}`); } catch { /* ignore */ }
      };
    } catch {
      // Reverb not running — real-time silently disabled, editor still works
      return () => { mounted = false; };
    }
  }, [token, page?.uuid]);

  // ── Title change — debounced PATCH 800 ms ──────────────────────────────────
  const handleTitleChange = useCallback(
    (title: string) => {
      // Update local state immediately for responsive UI
      setPage((prev) => (prev ? { ...prev, title } : prev));
      updatePage(pageId, { title });

      // Debounce the API call
      if (titleDebounce.current) clearTimeout(titleDebounce.current);
      titleDebounce.current = setTimeout(async () => {
        try {
          await api.patch(`/workspaces/${workspaceId}/pages/${pageId}`, {
            title,
          });
        } catch {
          /* silent — not critical */
        }
      }, 800);
    },
    [workspaceId, pageId, updatePage]
  );

  // ── Icon change ────────────────────────────────────────────────────────────
  const handleIconChange = useCallback(
    async (icon: string) => {
      setPage((prev) => (prev ? { ...prev, icon } : prev));
      updatePage(pageId, { icon });
      try {
        await api.patch(`/workspaces/${workspaceId}/pages/${pageId}`, { icon });
      } catch {
        /* silent */
      }
    },
    [workspaceId, pageId, updatePage]
  );

  // ── Cleanup debounce on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (titleDebounce.current) clearTimeout(titleDebounce.current);
    };
  }, []);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)]">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading page…</span>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
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
