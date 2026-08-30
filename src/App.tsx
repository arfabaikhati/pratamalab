import { lazy, Suspense, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";

import type { Block, BlockType, FocusReq, Profile, SlashDef, Toast, Workspace } from "./types";
import { usePages, mkBlock } from "./hooks/usePages";
import { stripHtml, countWords, timeAgo, PAGE_ICONS } from "./lib/util";

import Sidebar from "./components/Sidebar";
import BlockView from "./components/BlockView";
import type { BlockHandlers, SlashState } from "./components/BlockView";
import CollabCursors from "./components/CollabCursors";
import ExportMenu from "./components/ExportMenu";
import { IcPresent, IcDownload, IcShare } from "./components/icons";

const restrictToVerticalAxis = ({ transform }: { transform: { x: number; y: number; scaleX: number; scaleY: number } }) => ({
  ...transform,
  x: 0,
});

const PresentMode = lazy(() => import("./components/PresentMode"));

// ─── Slash definitions ────────────────────────────────────────

const SLASH_DEFS: SlashDef[] = [
  { type: "text",     label: "Teks",          desc: "Paragraf biasa",               kw: "text paragraph tulisan", group: "Teks" },
  { type: "h1",       label: "Judul 1",       desc: "Judul utama paling besar",     kw: "heading h1 judul besar", group: "Judul" },
  { type: "h2",       label: "Judul 2",       desc: "Judul seksi sedang",           kw: "heading h2 judul sedang", group: "Judul" },
  { type: "h3",       label: "Judul 3",       desc: "Judul seksi kecil",            kw: "heading h3 judul kecil", group: "Judul" },
  { type: "todo",     label: "Daftar Tugas",  desc: "Tugas dengan kotak centang",   kw: "todo checklist tugas centang", group: "List" },
  { type: "bullet",   label: "Poin",          desc: "Daftar dengan poin bulat",     kw: "bullet list poin daftar", group: "List" },
  { type: "numbered", label: "Bernomor",      desc: "Daftar bernomor urut",         kw: "numbered nomor urutan", group: "List" },
  { type: "quote",    label: "Kutipan",       desc: "Kutipan atau blockquote",      kw: "quote kutipan blockquote", group: "Teks" },
  { type: "callout",  label: "Sorotan",       desc: "Kotak info berikon",           kw: "callout highlight sorotan info", group: "Teks" },
  { type: "toggle",   label: "Toggle",        desc: "Konten yang bisa dilipat",     kw: "toggle collapse lipat", group: "Teks" },
  { type: "divider",  label: "Pemisah",       desc: "Garis pemisah antar bagian",   kw: "divider garis pemisah hr", group: "Teks" },
  { type: "formula",  label: "Rumus",         desc: "Kalkulator matematika",        kw: "formula rumus hitung math", group: "Data" },
  { type: "table",    label: "Tabel",         desc: "Baris & kolom yang bisa diedit", kw: "table tabel grid spreadsheet", group: "Data" },
  { type: "code",     label: "Kode",          desc: "Potongan kode program",        kw: "code kode snippet program", group: "Data" },
  { type: "image",    label: "Gambar",        desc: "Tambah gambar dari URL",       kw: "image gambar foto url", group: "Media" },
];

const TEXT_LIKE: BlockType[] = ["text","todo","bullet","numbered","quote","callout","h1","h2","h3","toggle"];

interface AppProps {
  profile: Profile;
  workspace: Workspace;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onSignOut: () => void;
}

export default function App({ profile, workspace, theme, toggleTheme, onSignOut }: AppProps) {
  const {
    pages, activePage, activePageId, setActivePageId, saveStatus, loading,
    createPage, deletePage, updatePageMeta,
    mutateBlocks, convertBlock, insertBlock, updateBlock, removeBlock,
    duplicateBlock, moveBlock, reorderBlocksLocal,
    splitBlock, mergeBlockWithPrev, applyMarkdownShortcut, cycleCalloutIcon,
  } = usePages(profile, workspace);

  // ── Local UI state ─────────────────────────────────────────
  const [focus, setFocus]         = useState<FocusReq | null>(null);
  const [slash, setSlash]         = useState<{ blockId: string; query: string } | null>(null);
  const [slashIdx, setSlashIdx]   = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [iconPicker, setIconPicker] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [dragActive, setDragActive] = useState<string | null>(null);

  const tick = useRef(1);
  const dismissed = useRef<{ id: string; q: string } | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  // ── DnD sensors ────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // ── Helpers ────────────────────────────────────────────────
  const toast = (msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  const focusTo = (id: string, pos: number) =>
    setFocus({ id, pos, tick: ++tick.current });

  // ── Slash menu items ───────────────────────────────────────
  const slashItems = useMemo(() => {
    if (!slash) return [] as SlashDef[];
    const q = slash.query.toLowerCase();
    return SLASH_DEFS.filter(
      (d) => !q || d.label.toLowerCase().includes(q) || d.kw.toLowerCase().includes(q)
    );
  }, [slash]);

  // ── Apply slash pick ───────────────────────────────────────
  const applySlash = (blockId: string, def: SlashDef) => {
    if (!activePage) return;
    const blk = activePage.blocks.find((b) => b.id === blockId);
    const plain = blk ? stripHtml(blk.html) : "";
    const isSlashOnly = plain.trim() === "" || /^\//.test(plain.trim());

    if (def.type === "divider") {
      const nb = mkBlock("text", activePage.id, (blk?.sort_order ?? 0) + 500);
      mutateBlocks(activePage.id, (bs) => {
        const i = bs.findIndex((b) => b.id === blockId);
        if (i < 0) return bs;
        const copy = [...bs];
        copy[i] = { ...copy[i], type: "divider", html: "", v: copy[i].v + 1 };
        copy.splice(i + 1, 0, nb);
        return copy;
      });
      setSlash(null); focusTo(nb.id, 0);
      return;
    }

    if (!isSlashOnly) {
      const nb = insertBlock(activePage.id, blockId, def.type);
      setSlash(null);
      if (TEXT_LIKE.includes(def.type)) focusTo(nb.id, 0);
      return;
    }

    convertBlock(activePage.id, blockId, def.type);
    setSlash(null);
    dismissed.current = null;
    focusTo(blockId, 0);
  };

  // ── Slash key handler ──────────────────────────────────────
  const onSlashKey = (blockId: string, e: ReactKeyboardEvent<HTMLDivElement>): boolean => {
    if (!slash || slash.blockId !== blockId) return false;
    const items = slashItems;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSlashIdx((i) => (items.length ? (i + 1) % items.length : 0));
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSlashIdx((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const d = items[Math.min(slashIdx, items.length - 1)];
      if (d) applySlash(blockId, d);
      else { dismissed.current = { id: blockId, q: slash.query }; setSlash(null); }
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      dismissed.current = { id: blockId, q: slash.query };
      setSlash(null);
      return true;
    }
    return false;
  };

  // ── Block change ───────────────────────────────────────────
  const onBlockChange = (id: string, html: string, plain: string) => {
    if (!activePage) return;
    const blk = activePage.blocks.find((b) => b.id === id);
    if (!blk) return;

    updateBlock(activePage.id, id, { html });

    if (!TEXT_LIKE.includes(blk.type)) {
      setSlash((s) => (s?.blockId === id ? null : s));
      return;
    }

    if (plain.startsWith("/")) {
      const q = plain.slice(1).toLowerCase().trim();
      const wasDismissed = dismissed.current?.id === id && dismissed.current.q === q;
      if (!wasDismissed) { setSlash({ blockId: id, query: q }); setSlashIdx(0); }
      return;
    }
    setSlash((s) => (s?.blockId === id ? null : s));

    if (blk.type === "text") {
      applyMarkdownShortcut(activePage.id, id, plain);
    }
  };

  // ── Enter key ──────────────────────────────────────────────
  const onEnter = (id: string, offset: number) => {
    if (!activePage) return;
    const nb = splitBlock(activePage.id, id, offset);
    if (nb && typeof nb === "object" && "id" in nb) {
      setSlash(null);
      focusTo((nb as Block).id, 0);
    }
  };

  // ── Backspace at start ─────────────────────────────────────
  const onBackspaceStart = (id: string) => {
    if (!activePage) return;
    const result = mergeBlockWithPrev(activePage.id, id);
    if (result) { setSlash(null); focusTo(result.targetId, result.mergePos); }
  };

  // ── Arrow navigation ───────────────────────────────────────
  const onArrow = (id: string, dir: "up" | "down") => {
    if (!activePage) return;
    const blocks = activePage.blocks;
    const idx = blocks.findIndex((b) => b.id === id);
    const target = dir === "up" ? blocks[idx - 1] : blocks[idx + 1];
    if (!target || !TEXT_LIKE.includes(target.type)) return;
    focusTo(target.id, dir === "up" ? 99999 : 0);
  };

  // ── Number tracking for numbered lists ────────────────────
  const getNum = (blocks: Block[], idx: number): number => {
    let n = 1;
    for (let i = idx - 1; i >= 0; i--) {
      if (blocks[i].type !== "numbered") break;
      n++;
    }
    return n;
  };

  // ── Block handlers object ─────────────────────────────────
  const handlers: BlockHandlers = {
    onChange: onBlockChange,
    onEnter,
    onBackspaceStart,
    onArrow,
    onSlashKey,
    focusReq: focus,
    onToggle: (id) => {
      if (!activePage) return;
      mutateBlocks(activePage.id, (bs) =>
        bs.map((b) => (b.id === id ? { ...b, checked: !b.checked } : b))
      );
    },
    onDelete: (id) => {
      if (!activePage) return;
      removeBlock(activePage.id, id);
      toast("Blok dihapus");
    },
    onDuplicate: (id) => {
      if (!activePage) return;
      const copy = duplicateBlock(activePage.id, id);
      if (copy && TEXT_LIKE.includes(copy.type)) focusTo(copy.id, 99999);
      toast("Blok diduplikat");
    },
    onMove: (id, dir) => {
      if (!activePage) return;
      moveBlock(activePage.id, id, dir);
    },
    onPlus: (id) => {
      setSlash({ blockId: id, query: "" });
      setSlashIdx(0);
    },
    onFormulaChange: (id, expr) => {
      if (!activePage) return;
      updateBlock(activePage.id, id, { html: expr });
    },
    onRowsChange: (id, rows) => {
      if (!activePage) return;
      updateBlock(activePage.id, id, { rows });
    },
    onCodeChange: (id, code) => {
      if (!activePage) return;
      updateBlock(activePage.id, id, { html: code });
    },
    onCodeLang: (id, lang) => {
      if (!activePage) return;
      updateBlock(activePage.id, id, { lang });
    },
    onPropsChange: (id, props) => {
      if (!activePage) return;
      updateBlock(activePage.id, id, { props });
    },
    onCalloutIcon: (id) => {
      if (!activePage) return;
      cycleCalloutIcon(activePage.id, id);
    },
    onToast: toast,
  };

  // ── DnD handlers ──────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setDragActive(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragActive(null);
    if (!activePage) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const blocks = activePage.blocks;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(blocks, oldIdx, newIdx).map((b, i) => ({
      ...b,
      sort_order: i * 1000,
    }));
    reorderBlocksLocal(activePage.id, reordered);
  };

  // ── New page ───────────────────────────────────────────────
  const handleNewPage = async () => {
    try {
      await createPage();
      setMobileNav(false);
      setTimeout(() => titleRef.current?.focus(), 80);
    } catch {
      toast("Gagal membuat halaman");
    }
  };

  // ── Word count ─────────────────────────────────────────────
  const wordCount = useMemo(() => {
    if (!activePage) return 0;
    return activePage.blocks.reduce(
      (acc, b) => acc + countWords(stripHtml(b.html)),
      countWords(activePage.title)
    );
  }, [activePage]);

  // ── Drag overlay block ─────────────────────────────────────
  const dragBlock = dragActive
    ? activePage?.blocks.find((b) => b.id === dragActive)
    : null;

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        flex: 1, background: "var(--bg)", flexDirection: "column", gap: 14,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTopColor: "var(--accent)",
          animation: "spin-slow 1s linear infinite",
        }} />
        <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Memuat halaman…</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", width: "100%", height: "100dvh", background: "var(--bg)", overflow: "hidden" }}>
      {/* ── Mobile overlay ── */}
      {mobileNav && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMobileNav(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div style={{
        position: "fixed" as const,
        top: 0, left: 0, zIndex: 50, height: "100dvh",
        transform: mobileNav ? "translateX(0)" : undefined,
        transition: "transform 0.22s var(--ease-out)",
        display: "flex",
      }}
        className="sidebar no-print"
      >
        <Sidebar
          profile={profile}
          workspace={workspace}
          pages={pages}
          activePageId={activePageId}
          onSelectPage={(id) => { setActivePageId(id); setMobileNav(false); }}
          onNewPage={handleNewPage}
          onDeletePage={async (id) => {
            try {
              await deletePage(id);
              toast("Halaman dihapus");
            } catch {
              toast("Gagal menghapus halaman");
            }
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSignOut={onSignOut}
          saveStatus={saveStatus}
          onClose={() => setMobileNav(false)}
        />
      </div>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        marginLeft: 260,
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
        className="page-content"
      >
        {activePage ? (
          <>
            {/* ── Top toolbar ── */}
            <header style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 32px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0, gap: 12,
              background: "var(--bg)",
              backdropFilter: "blur(8px)",
            }}
              className="toolbar no-print"
            >
              {/* Left: mobile menu + breadcrumb */}
              <div className="toolbar-breadcrumb" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <button
                  onClick={() => setMobileNav((v) => !v)}
                  className="btn btn-icon"
                  style={{ display: "none" }}
                  aria-label="Menu"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <span style={{ fontSize: 16 }}>{activePage.icon}</span>
                <span className="toolbar-title" style={{
                  fontSize: 14, fontWeight: 600,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  maxWidth: 220,
                }}>
                  {activePage.title || "Tanpa Judul"}
                </span>
              </div>

              {/* Right: collab + actions */}
              <div className="toolbar-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <CollabCursors pageId={activePage.id} profile={profile} />

                {/* Metadata */}
                <span className="toolbar-meta" style={{
                  fontSize: 11.5, color: "var(--text-tertiary)",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span>{wordCount} kata</span>
                  <span>·</span>
                  <span>{timeAgo(activePage.updated_at)}</span>
                </span>

                {/* Present */}
                <button
                  onClick={() => setPresenting(true)}
                  className="btn btn-ghost btn-sm"
                  title="Mode presentasi"
                  style={{ gap: 6 }}
                >
                  <IcPresent size={14} />
                  <span className="toolbar-action-label" style={{ fontSize: 12.5 }}>Presentasi</span>
                </button>

                {/* Export */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setExportOpen((v) => !v)}
                    className="btn btn-ghost btn-sm"
                    title="Ekspor"
                    style={{ gap: 6 }}
                  >
                    <IcDownload size={14} />
                    <span className="toolbar-action-label" style={{ fontSize: 12.5 }}>Ekspor</span>
                  </button>
                  {exportOpen && (
                    <ExportMenu page={activePage} onClose={() => setExportOpen(false)} />
                  )}
                </div>

                {/* Share */}
                <button
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("page", activePage.id);
                    navigator.clipboard?.writeText(url.toString())
                      .then(() => toast("Tautan halaman disalin"))
                      .catch(() => toast("Gagal menyalin tautan"));
                  }}
                  className="btn btn-ghost btn-sm"
                  title="Bagikan"
                  style={{ gap: 6 }}
                >
                  <IcShare size={14} />
                  <span className="toolbar-action-label" style={{ fontSize: 12.5 }}>Bagikan</span>
                </button>
              </div>
            </header>

            {/* ── Page editor ── */}
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "0 max(32px, calc(50% - 380px))",
              paddingBottom: 120,
            }}>
              {/* Cover image */}
              {activePage.cover_url && (
                <div style={{
                  height: 220, marginBottom: 0,
                  background: `url(${activePage.cover_url}) center/cover`,
                  marginLeft: "-max(32px, calc(50% - 380px))",
                  width: "calc(100% + 2 * max(32px, calc(50% - 380px)))",
                }} />
              )}

              {/* Page icon + title */}
              <div style={{ paddingTop: activePage.cover_url ? 0 : 40 }}>
                {/* Icon picker */}
                <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
                  <button
                    onClick={() => setIconPicker((v) => !v)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 46, lineHeight: 1, padding: "4px 2px",
                      borderRadius: 12, transition: "transform 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    title="Ganti ikon"
                  >
                    {activePage.icon}
                  </button>
                  {iconPicker && (
                    <>
                      <div
                        style={{ position: "fixed", inset: 0, zIndex: 90 }}
                        onClick={() => setIconPicker(false)}
                      />
                      <div style={{
                        position: "absolute", top: "calc(100% + 6px)", left: 0,
                        zIndex: 100, background: "var(--surface-overlay)",
                        border: "1px solid var(--border)",
                        borderRadius: 14, padding: 10,
                        boxShadow: "var(--shadow-xl)",
                        display: "flex", flexWrap: "wrap", gap: 5,
                        maxWidth: 260,
                        animation: "pop-in 0.15s var(--ease-spring) both",
                      }}>
                        {PAGE_ICONS.map((em) => (
                          <button
                            key={em}
                            onClick={() => {
                              updatePageMeta(activePage.id, { icon: em });
                              setIconPicker(false);
                            }}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              fontSize: 22, padding: 5, borderRadius: 8,
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Title */}
                <input
                  ref={titleRef}
                  value={activePage.title}
                  onChange={(e) =>
                    updatePageMeta(activePage.id, { title: e.target.value })
                  }
                  placeholder="Judul halaman…"
                  style={{
                    display: "block", width: "100%",
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                    fontWeight: 800, lineHeight: 1.15,
                    color: "var(--text-primary)",
                    background: "transparent", border: "none", outline: "none",
                    marginBottom: 4,
                    caretColor: "var(--accent)",
                  }}
                />

                {/* Metadata row */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 16,
                  marginBottom: 24, marginTop: 4,
                  fontSize: 12, color: "var(--text-tertiary)",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 16,
                }}>
                  <span>📅 {new Date(activePage.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span>✍️ {activePage.blocks.length} blok</span>
                  <span>📖 {wordCount} kata</span>
                </div>
              </div>

              {/* ── Block list with DnD ── */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activePage.blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={{ paddingLeft: 48, position: "relative" }}>
                    {activePage.blocks.map((block, i) => {
                      const isSlashBlock = slash?.blockId === block.id;
                      const slashState: SlashState | null = isSlashBlock
                        ? {
                            query: slash!.query,
                            idx: slashIdx,
                            items: slashItems,
                            onIdx: setSlashIdx,
                            onPick: (d) => applySlash(block.id, d),
                          }
                        : null;

                      return (
                        <BlockView
                          key={block.id}
                          block={block}
                          i={i}
                          num={
                            block.type === "numbered"
                              ? getNum(activePage.blocks, i)
                              : undefined
                          }
                          h={handlers}
                          slash={slashState}
                        />
                      );
                    })}

                    {/* Click below to add block */}
                    <div
                      onClick={() => {
                        const last = activePage.blocks[activePage.blocks.length - 1];
                        if (last && stripHtml(last.html) === "" && last.type === "text") {
                          focusTo(last.id, 0);
                        } else {
                          const nb = insertBlock(activePage.id, last?.id ?? null, "text");
                          focusTo(nb.id, 0);
                        }
                      }}
                      style={{
                        height: 60, cursor: "text",
                        display: "flex", alignItems: "center",
                        color: "var(--text-tertiary)", fontSize: 13.5,
                        opacity: 0,
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                    >
                      + Klik untuk tambah blok
                    </div>
                  </div>
                </SortableContext>

                {/* Drag overlay */}
                <DragOverlay>
                  {dragBlock ? (
                    <div style={{
                      background: "var(--surface)",
                      border: "2px dashed var(--accent)",
                      borderRadius: 10, padding: "8px 14px",
                      opacity: 0.85, boxShadow: "var(--shadow-lg)",
                      fontSize: 14, color: "var(--text-primary)",
                    }}>
                      {dragBlock.type} · {stripHtml(dragBlock.html).slice(0, 40) || "—"}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </>
        ) : (
          /* ── Empty state ── */
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 16, color: "var(--text-tertiary)",
          }}>
            <span style={{ fontSize: 52 }}>📄</span>
            <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>
              Pilih halaman atau buat yang baru
            </p>
            <button
              onClick={handleNewPage}
              className="btn btn-primary"
              style={{ marginTop: 6 }}
            >
              + Halaman Baru
            </button>
          </div>
        )}
      </main>

      {/* ── Present mode ── */}
      {presenting && activePage && (
        <Suspense fallback={null}>
          <PresentMode page={activePage} onClose={() => setPresenting(false)} />
        </Suspense>
      )}

      {/* ── Toasts ── */}
      <div style={{
        position: "fixed", bottom: 24, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 500, display: "flex", flexDirection: "column",
        alignItems: "center", gap: 8, pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── Mobile styles ── */}
      <style>{`
        @media (max-width: 768px) {
          main { margin-left: 0 !important; }
          .sidebar { transform: translateX(-100%); }
          .toolbar button[aria-label="Menu"] { display: grid !important; }
          .toolbar { padding: 8px 12px !important; gap: 4px !important; }
          .toolbar-breadcrumb { flex: 1; gap: 6px !important; overflow: hidden; }
          .toolbar-title { max-width: 92px !important; font-size: 12.5px !important; }
          .toolbar-actions { gap: 1px !important; }
          .toolbar-actions .btn { padding: 7px !important; }
          .toolbar-meta, .toolbar-action-label { display: none !important; }
          .block-left-controls { opacity: .45 !important; }
        }
        .group:hover .block-left-controls { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
