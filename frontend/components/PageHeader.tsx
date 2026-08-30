"use client";

import { useState, useRef, useEffect } from "react";
import { cn, avatarColor, getInitials } from "@/lib/utils";
import type { OnlineUser, Page } from "@/types";
import { Lock, Globe, Eye, EyeOff, PanelLeft } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace";

interface PageHeaderProps {
  page: Page;
  onTitleChange: (title: string) => void;
  onIconChange:  (icon: string) => void;
  onCoverChange: (cover: string) => void;
  onlineUsers:   OnlineUser[];
}

const QUICK_EMOJIS = [
  "📄","📝","🗒️","📌","🗂️","📚","💡","🔥","⭐","🎯",
  "🚀","🏗️","🧠","💼","🎨","📊","📈","🔧","🛠️","✅",
  "🌍","🎵","🏆","🔬","💻","📷","🎬","🍀","🦋","🌈",
];

export default function PageHeader({
  page,
  onTitleChange,
  onIconChange,
  onlineUsers,
}: PageHeaderProps) {
  const [titleValue, setTitleValue]       = useState(page.title ?? "");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const titleRef      = useRef<HTMLTextAreaElement>(null);
  const pickerRef     = useRef<HTMLDivElement>(null);

  // Sync title if page prop changes (e.g. real-time update from another user)
  useEffect(() => {
    setTitleValue(page.title ?? "");
  }, [page.title]);

  // Close icon picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowIconPicker(false);
      }
    }
    if (showIconPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showIconPicker]);

  // Auto-resize textarea on mount
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = titleRef.current.scrollHeight + "px";
    }
  }, [titleValue]);

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const editorEl = document.querySelector<HTMLElement>(".bn-editor");
      editorEl?.focus();
    }
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setTitleValue(val);
    onTitleChange(val);
  }

  function handleIconSelect(emoji: string) {
    onIconChange(emoji);          // ✅ was commented out before — now fixed
    setShowIconPicker(false);
  }

  return (
    <div className="relative flex-shrink-0">
      {/* Cover image */}
      {page.cover && (
        <div
          className="w-full h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${page.cover})` }}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition"
          title="Toggle sidebar"
        >
          <PanelLeft size={16} />
        </button>

        {/* Online collaborators + access badge */}
        <div className="flex items-center gap-2">
          {onlineUsers.length > 0 && (
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  title={u.name}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 border-[var(--bg)] flex items-center justify-center text-white text-xs font-semibold ring-1 ring-brand-400",
                    avatarColor(u.id)
                  )}
                >
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(u.name)
                  )}
                </div>
              ))}
              {onlineUsers.length > 5 && (
                <div className="w-7 h-7 rounded-full border-2 border-[var(--bg)] bg-[var(--bg-secondary)] flex items-center justify-center text-xs text-[var(--text-secondary)]">
                  +{onlineUsers.length - 5}
                </div>
              )}
            </div>
          )}

          {/* Access badge */}
          <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] px-2 py-1 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]">
            {page.is_locked  && <Lock  size={11} />}
            {page.access === "public"    && <Globe  size={11} />}
            {page.access === "private"   && <EyeOff size={11} />}
            {page.access === "workspace" && <Eye    size={11} />}
            <span className="capitalize">{page.access}</span>
          </div>
        </div>
      </div>

      {/* Page title area */}
      <div className="max-w-3xl mx-auto px-8 pt-10 pb-4">
        {/* Icon picker */}
        <div className="relative mb-3" ref={pickerRef}>
          <button
            onClick={() => setShowIconPicker((v) => !v)}
            className="text-5xl leading-none hover:opacity-70 transition rounded-lg p-1 -ml-1"
            title="Change icon"
            disabled={page.is_locked}
          >
            {page.icon ?? "📄"}
          </button>

          {showIconPicker && (
            <div className="absolute top-full left-0 z-50 mt-1 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-card,0_4px_24px_rgba(0,0,0,.12))] grid grid-cols-10 gap-1 min-w-[280px]">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleIconSelect(emoji)}
                  className="text-xl p-1 rounded hover:bg-[var(--bg-hover)] transition"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title textarea */}
        <textarea
          ref={titleRef}
          value={titleValue}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled"
          rows={1}
          className="w-full text-[2.5rem] font-bold leading-tight bg-transparent border-none outline-none resize-none overflow-hidden placeholder:text-[var(--text-muted)]"
          style={{ fontFamily: "inherit" }}
          disabled={page.is_locked}
        />
      </div>
    </div>
  );
}
