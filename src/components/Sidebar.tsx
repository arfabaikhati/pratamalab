import { useEffect, useRef, useState } from "react";
import type { Page, Profile, Workspace } from "../types";
import { timeAgo, getInitials } from "../lib/util";

interface Props {
  profile: Profile;
  workspace: Workspace;
  pages: Page[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onNewPage: () => void;
  onDeletePage: (id: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onSignOut: () => void;
  saveStatus: "saved" | "saving" | "error";
  onClose?: () => void;
}

function NavItem({
  page,
  active,
  onSelect,
  onDelete,
}: {
  page: Page;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover]         = useState(false);
  const [confirmDelete, setConfirm] = useState(false);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
      setConfirm(false);
    } else {
      setConfirm(true);
      deleteTimer.current = setTimeout(() => setConfirm(false), 2600);
    }
  };

  useEffect(() => () => { if (deleteTimer.current) clearTimeout(deleteTimer.current); }, []);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setConfirm(false); }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 8,
        cursor: "pointer",
        transition: "background 0.15s",
        background: active
          ? "var(--sidebar-active)"
          : hover
          ? "var(--sidebar-hover)"
          : "transparent",
        position: "relative",
      }}
    >
      <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1 }}>{page.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: active ? 600 : 400,
          color: active ? "#fff" : "var(--sidebar-text)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {page.title || <span style={{ opacity: 0.4 }}>Tanpa judul</span>}
        </div>
        {hover && (
          <div style={{ fontSize: 10.5, color: "var(--sidebar-muted)", marginTop: 1 }}>
            {timeAgo(page.updated_at)}
          </div>
        )}
      </div>

      {hover && (
        <button
          onClick={handleDelete}
          title={confirmDelete ? "Klik lagi untuk konfirmasi" : "Hapus halaman"}
          style={{
            flexShrink: 0,
            width: 22, height: 22,
            borderRadius: 5,
            border: "none",
            cursor: "pointer",
            display: "grid", placeItems: "center",
            background: confirmDelete ? "rgba(239,68,68,0.25)" : "transparent",
            color: confirmDelete ? "#fca5a5" : "var(--sidebar-muted)",
            fontSize: 11,
            transition: "all 0.15s",
          }}
        >
          {confirmDelete ? "✓" : "×"}
        </button>
      )}
    </div>
  );
}

export default function Sidebar({
  profile, workspace, pages, activePageId,
  onSelectPage, onNewPage, onDeletePage,
  theme, onToggleTheme, onSignOut, saveStatus, onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const filtered = search.trim()
    ? pages.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.icon.includes(search)
      )
    : pages;

  const totalBlocks = pages.reduce((acc, p) => acc + (p.blocks?.length ?? 0), 0);

  return (
    <aside
      style={{
        width: 260,
        minWidth: 260,
        height: "100dvh",
        background: "var(--sidebar-bg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: "14px 12px 10px", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          {/* Workspace identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "grid", placeItems: "center",
              fontSize: 15, flexShrink: 0,
            }}>
              {workspace.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: "var(--sidebar-text)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: 130,
              }}>
                {workspace.name}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--sidebar-muted)" }}>
                {workspace.plan === "free" ? "Free plan" : workspace.plan === "pro" ? "Pro" : "Team"}
              </div>
            </div>
          </div>

          {/* Close (mobile) */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "transparent", border: "none",
                color: "var(--sidebar-muted)", cursor: "pointer",
                padding: 4, borderRadius: 6, fontSize: 16, lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{
              position: "absolute", left: 10, top: "50%",
              transform: "translateY(-50%)",
              color: "var(--sidebar-muted)", pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari halaman…"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, color: "var(--sidebar-text)",
              fontSize: 13, padding: "7px 10px 7px 30px",
              outline: "none", fontFamily: "var(--font-sans)",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: 7, top: "50%",
                transform: "translateY(-50%)",
                background: "transparent", border: "none",
                color: "var(--sidebar-muted)", cursor: "pointer",
                fontSize: 14, lineHeight: 1, padding: 2,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Page list ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {/* Section header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 6px 4px",
        }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--sidebar-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Halaman
          </span>
          <button
            onClick={onNewPage}
            title="Halaman baru"
            style={{
              background: "transparent", border: "none",
              color: "var(--sidebar-muted)", cursor: "pointer",
              width: 20, height: 20, borderRadius: 4,
              display: "grid", placeItems: "center",
              fontSize: 16, lineHeight: 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--sidebar-hover)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--sidebar-muted)";
            }}
          >
            +
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{
            padding: "20px 8px",
            textAlign: "center",
            color: "var(--sidebar-muted)",
            fontSize: 13,
          }}>
            {search ? "Tidak ada hasil" : "Belum ada halaman"}
          </div>
        ) : (
          filtered.map((page) => (
            <NavItem
              key={page.id}
              page={page}
              active={page.id === activePageId}
              onSelect={() => onSelectPage(page.id)}
              onDelete={() => onDeletePage(page.id)}
            />
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: "8px 12px 12px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        {/* Stats row */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 10,
          fontSize: 11, color: "var(--sidebar-muted)",
        }}>
          <span>{pages.length} hal.</span>
          <span>{totalBlocks} blok</span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            {saveStatus === "saving" ? (
              <>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--warning)",
                  animation: "pulse-soft 1s ease-in-out infinite",
                  display: "inline-block",
                }} />
                Menyimpan…
              </>
            ) : saveStatus === "error" ? (
              <>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", display: "inline-block" }} />
                Gagal simpan
              </>
            ) : (
              <>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                Tersimpan
              </>
            )}
          </span>
        </div>

        {/* Theme toggle + profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Theme */}
          <button
            onClick={onToggleTheme}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
            style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, width: 32, height: 32,
              cursor: "pointer", display: "grid", placeItems: "center",
              fontSize: 14, transition: "all 0.15s", flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Profile */}
          <button
            onClick={() => setShowProfile((v) => !v)}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", gap: 8,
              background: showProfile ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "5px 8px",
              cursor: "pointer", transition: "all 0.15s",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = showProfile ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)")}
          >
            <div
              style={{
                width: 24, height: 24, borderRadius: "50%",
                background: profile.avatar_color,
                display: "grid", placeItems: "center",
                fontSize: 10, fontWeight: 700, color: "#fff",
                flexShrink: 0, overflow: "hidden",
              }}
            >
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.display_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : getInitials(profile.display_name)
              }
            </div>
            <div style={{ textAlign: "left", minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--sidebar-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>
                {profile.display_name}
              </div>
            </div>
          </button>
        </div>

        {/* Profile dropdown */}
        {showProfile && (
          <div style={{
            marginTop: 6,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            overflow: "hidden",
            animation: "slide-up 0.15s ease-out both",
          }}>
            <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sidebar-text)" }}>{profile.display_name}</div>
              <div style={{ fontSize: 11, color: "var(--sidebar-muted)", marginTop: 1 }}>{profile.email}</div>
            </div>
            <button
              onClick={onSignOut}
              style={{
                width: "100%", padding: "9px 12px",
                background: "transparent", border: "none",
                color: "#fca5a5", cursor: "pointer",
                fontFamily: "var(--font-sans)", fontSize: 13, textAlign: "left",
                display: "flex", alignItems: "center", gap: 8,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span>↩</span> Keluar
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
