import { useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block, FocusReq, SlashDef } from "../types";
import Editable from "./Editable";
import FormulaBlock from "./FormulaBlock";
import TableBlock from "./TableBlock";
import SlashMenu from "./SlashMenu";
import { isSafeHttpUrl } from "../lib/util";

// ─── Types ───────────────────────────────────────────────────

export interface BlockHandlers {
  onChange:         (id: string, html: string, plain: string) => void;
  onEnter:          (id: string, offset: number) => void;
  onBackspaceStart: (id: string) => void;
  onArrow:          (id: string, dir: "up" | "down") => void;
  onSlashKey:       (id: string, e: ReactKeyboardEvent<HTMLDivElement>) => boolean;
  onToggle:         (id: string) => void;
  onDelete:         (id: string) => void;
  onDuplicate:      (id: string) => void;
  onMove:           (id: string, dir: "up" | "down") => void;
  onPlus:           (id: string) => void;
  onFormulaChange:  (id: string, expr: string) => void;
  onRowsChange:     (id: string, rows: string[][]) => void;
  onCodeChange:     (id: string, code: string) => void;
  onCodeLang:       (id: string, lang: string) => void;
  onPropsChange:    (id: string, props: Record<string, unknown>) => void;
  onCalloutIcon:    (id: string) => void;
  onToast:          (msg: string) => void;
  focusReq:         FocusReq | null;
}

export interface SlashState {
  query:  string;
  idx:    number;
  items:  SlashDef[];
  onIdx:  (i: number) => void;
  onPick: (d: SlashDef) => void;
}

// ─── Placeholders ────────────────────────────────────────────

const PH: Partial<Record<Block["type"], string>> = {
  text:     "Ketik sesuatu, atau tekan / untuk perintah…",
  h1:       "Judul 1",
  h2:       "Judul 2",
  h3:       "Judul 3",
  todo:     "Tugas baru…",
  bullet:   "Tulis poin…",
  numbered: "Tulis poin bernomor…",
  quote:    "Tulis kutipan…",
  callout:  "Tulis sorotan…",
  toggle:   "Toggle — klik untuk buka/tutup",
};

const LANGS = ["js","ts","tsx","python","sql","html","css","bash","json","rust","go","java","php","cpp"];

// ─── Rich Text Toolbar ───────────────────────────────────────

function RichToolbar({ onFormat }: { onFormat: (cmd: string, val?: string) => void }) {
  const tools = [
    { cmd: "bold",          icon: <strong style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>B</strong>,     title: "Tebal (Ctrl+B)" },
    { cmd: "italic",        icon: <em style={{ fontSize: 12 }}>I</em>,                                              title: "Miring (Ctrl+I)" },
    { cmd: "underline",     icon: <u style={{ fontSize: 12 }}>U</u>,                                               title: "Garis bawah (Ctrl+U)" },
    { cmd: "strikethrough", icon: <s style={{ fontSize: 11 }}>S</s>,                                               title: "Coret" },
    { cmd: "_code",         icon: <code style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}>{"`"}</code>,       title: "Kode inline" },
    { cmd: "_link",         icon: <span style={{ fontSize: 11 }}>🔗</span>,                                         title: "Tautan" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 6px)",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "var(--sidebar-bg)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "4px 5px",
        boxShadow: "var(--shadow-xl)",
        zIndex: 300,
        animation: "pop-in 0.15s var(--ease-spring) both",
        whiteSpace: "nowrap",
      }}
    >
      {tools.map((t) => (
        <button
          key={t.cmd}
          onMouseDown={(e) => { e.preventDefault(); onFormat(t.cmd); }}
          title={t.title}
          style={{
            background: "transparent", border: "none",
            borderRadius: 6, padding: "4px 7px",
            cursor: "pointer", color: "#fff",
            display: "grid", placeItems: "center",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {t.icon}
        </button>
      ))}
      <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", margin: "0 3px" }} />
      {/* Text color */}
      {["#6366f1","#ef4444","#f59e0b","#22c55e","#3b82f6"].map((color) => (
        <button
          key={color}
          onMouseDown={(e) => { e.preventDefault(); onFormat("foreColor", color); }}
          title={`Warna ${color}`}
          style={{
            width: 14, height: 14, borderRadius: "50%",
            background: color, border: "none", cursor: "pointer",
            margin: "0 1px",
            transition: "transform 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
      ))}
    </div>
  );
}

// ─── Code Block ──────────────────────────────────────────────

function CodeBlock({ block, h }: { block: Block; h: BlockHandlers }) {
  const lines = Math.max(3, block.html.split("\n").length);
  return (
    <div style={{
      margin: "4px 0",
      borderRadius: 12,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      background: "var(--code-bg)",
      boxShadow: "var(--shadow-md)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "flex", gap: 5 }}>
            {["#ff5f57","#febc2e","#28c840"].map((c) => (
              <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />
            ))}
          </span>
          <select
            value={block.lang ?? "js"}
            onChange={(e) => h.onCodeLang(block.id, e.target.value)}
            style={{
              background: "transparent",
              border: "none", outline: "none",
              fontFamily: "var(--font-mono)",
              fontSize: 11, fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
            }}
          >
            {LANGS.map((l) => <option key={l} value={l} style={{ background: "#0f172a" }}>{l}</option>)}
          </select>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(block.html).then(
              () => h.onToast("✅ Kode disalin"),
              () => h.onToast("❌ Gagal menyalin")
            );
          }}
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, padding: "3px 9px",
            color: "rgba(255,255,255,0.5)",
            fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
        >
          Salin
        </button>
      </div>
      <textarea
        value={block.html}
        onChange={(e) => h.onCodeChange(block.id, e.target.value)}
        rows={lines}
        spellCheck={false}
        placeholder="// tulis kode di sini…"
        style={{
          display: "block", width: "100%",
          background: "transparent", border: "none", outline: "none",
          resize: "none",
          fontFamily: "var(--font-mono)", fontSize: 13,
          lineHeight: 1.65, color: "var(--code-text)",
          padding: "14px 16px",
        }}
      />
    </div>
  );
}

// ─── Toggle Block ─────────────────────────────────────────────

function ToggleBlock({ block, h, editableEl }: { block: Block; h: BlockHandlers; editableEl: React.ReactNode }) {
  const open = (block.props as { open?: boolean })?.open ?? false;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <button
          onClick={() => h.onPropsChange(block.id, { ...(block.props ?? {}), open: !open })}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-tertiary)", padding: "3px 2px",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            flexShrink: 0,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          ▶
        </button>
        <div style={{ flex: 1 }}>{editableEl}</div>
      </div>
    </div>
  );
}

function ImageBlock({ block, h }: { block: Block; h: BlockHandlers }) {
  const savedUrl = (block.props as { url?: string })?.url ?? "";
  const [draftUrl, setDraftUrl] = useState(savedUrl);

  if (savedUrl) {
    return (
      <figure style={{ margin: "8px 0" }}>
        <img
          src={savedUrl}
          alt={(block.props as { caption?: string })?.caption ?? ""}
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{ maxWidth: "100%", borderRadius: 12, display: "block", boxShadow: "var(--shadow-sm)" }}
        />
        <input
          value={(block.props as { caption?: string })?.caption ?? ""}
          onChange={(e) => h.onPropsChange(block.id, { ...(block.props ?? {}), caption: e.target.value })}
          placeholder="Tambah keterangan gambar…"
          aria-label="Keterangan gambar"
          style={{
            width: "100%", marginTop: 8, background: "transparent", border: "none", outline: "none",
            fontSize: 12.5, textAlign: "center", color: "var(--text-tertiary)",
            fontFamily: "var(--font-sans)", fontStyle: "italic",
          }}
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => { setDraftUrl(savedUrl); h.onPropsChange(block.id, { ...(block.props ?? {}), url: "" }); }}
          style={{ display: "block", margin: "4px auto 0", fontSize: 11 }}
        >
          Ganti gambar
        </button>
      </figure>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const next = draftUrl.trim();
        if (!isSafeHttpUrl(next)) {
          h.onToast("URL gambar harus diawali http:// atau https://");
          return;
        }
        h.onPropsChange(block.id, { ...(block.props ?? {}), url: next });
      }}
      style={{
        margin: "8px 0", border: "1.5px dashed var(--border-strong)", borderRadius: 12,
        padding: 18, background: "var(--bg-secondary)",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>🖼️</div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 650, color: "var(--text-primary)", marginBottom: 8 }}>
        Tambahkan gambar dari URL aman
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          placeholder="https://contoh.com/gambar.jpg"
          aria-label="URL gambar"
          className="input"
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="submit" className="btn btn-primary btn-sm">Tambahkan</button>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--text-tertiary)" }}>
        Hanya URL HTTP/HTTPS yang diterima.
      </p>
    </form>
  );
}

// ─── Block Context Menu ──────────────────────────────────────

function BlockMenu({ blockId, onClose, h }: {
  blockId: string;
  onClose: () => void;
  h: BlockHandlers;
}) {
  const items = [
    { label: "⬆ Geser naik",   action: () => h.onMove(blockId, "up") },
    { label: "⬇ Geser turun",  action: () => h.onMove(blockId, "down") },
    { label: "⧉  Duplikat",     action: () => h.onDuplicate(blockId) },
    { label: "📋 Salin sebagai teks", action: () => {
      const el = document.querySelector(`[data-block-id="${blockId}"] .editable`) as HTMLElement | null;
      navigator.clipboard?.writeText(el?.textContent ?? "").then(() => h.onToast("✅ Teks disalin"));
    }},
  ];

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={onClose} />
      <div
        style={{
          position: "absolute", left: "calc(100% + 6px)", top: 0,
          zIndex: 300, minWidth: 180,
          background: "var(--surface-overlay)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 5,
          boxShadow: "var(--shadow-xl)",
          animation: "pop-in 0.15s var(--ease-spring) both",
        }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => { item.action(); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "8px 10px",
              border: "none", borderRadius: 7,
              background: "transparent", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
              color: "var(--text-primary)", textAlign: "left",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {item.label}
          </button>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "4px 6px" }} />
        <button
          onClick={() => { h.onDelete(blockId); onClose(); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "8px 10px",
            border: "none", borderRadius: 7,
            background: "transparent", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
            color: "var(--danger)", textAlign: "left",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--danger-soft)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          🗑 Hapus blok
        </button>
      </div>
    </>
  );
}

// ─── Main BlockView ──────────────────────────────────────────

export default function BlockView({
  block: b, i, num, h, slash,
}: {
  block: Block;
  i: number;
  num?: number;
  h: BlockHandlers;
  slash?: SlashState | null;
}) {
  const [menu, setMenu]       = useState(false);
  const [toolbar, setToolbar] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const editable = !["code","formula","table","divider","image","embed"].includes(b.type);
  const focusReq = h.focusReq?.id === b.id ? h.focusReq : null;

  // ── DnD sortable ──────────────────────────────────────────
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: b.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
  };

  // ── Rich text formatting ──────────────────────────────────
  const handleFormat = (cmd: string, val?: string) => {
    if (cmd === "_code") {
      const selected = window.getSelection()?.toString() ?? "kode";
      const safe = selected.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      document.execCommand("insertHTML", false, `<code>${safe}</code>`);
    } else if (cmd === "_link") {
      const url = prompt("URL tautan:");
      if (url && isSafeHttpUrl(url)) document.execCommand("createLink", false, url);
      else if (url) h.onToast("URL harus diawali http:// atau https://");
    } else {
      document.execCommand(cmd, false, val);
    }
    setToolbar(false);
  };

  // ── Selection listener → show toolbar ────────────────────
  const handleSelect = () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().length > 0) {
      setToolbar(true);
    } else {
      setToolbar(false);
    }
  };

  // ── Editable element ──────────────────────────────────────
  const editableEl = editable && (
    <Editable
      html={b.html}
      mountKey={`${b.id}:${b.v}`}
      ph={PH[b.type]}
      focusReq={focusReq}
      onChange={(html, plain) => h.onChange(b.id, html, plain)}
      onEnter={(off) => h.onEnter(b.id, off)}
      onBackspaceStart={() => h.onBackspaceStart(b.id)}
      onArrowNav={(dir) => h.onArrow(b.id, dir)}
      onKeyDown={(e) => h.onSlashKey(b.id, e)}
      onSelect={handleSelect}
      onBlur={() => setTimeout(() => setToolbar(false), 200)}
    />
  );

  // ── Content by type ───────────────────────────────────────
  const content = (() => {
    switch (b.type) {
      case "h1":
        return (
          <div style={{ paddingTop: 20, paddingBottom: 4, position: "relative" }}>
            {toolbar && <RichToolbar onFormat={handleFormat} />}
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem", fontWeight: 800,
              lineHeight: 1.2, color: "var(--text-primary)",
            }}>{editableEl}</div>
          </div>
        );
      case "h2":
        return (
          <div style={{ paddingTop: 16, paddingBottom: 2, display: "flex", alignItems: "baseline", gap: 10, position: "relative" }}>
            {toolbar && <RichToolbar onFormat={handleFormat} />}
            <span style={{
              width: 7, height: 7, flexShrink: 0,
              borderRadius: 2, background: "var(--accent)",
              transform: "translateY(-1px)", display: "inline-block",
            }} />
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.45rem", fontWeight: 700, lineHeight: 1.25,
              color: "var(--text-primary)",
            }}>{editableEl}</div>
          </div>
        );
      case "h3":
        return (
          <div style={{ paddingTop: 10, position: "relative" }}>
            {toolbar && <RichToolbar onFormat={handleFormat} />}
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem", fontWeight: 600,
              color: "var(--text-primary)",
            }}>{editableEl}</div>
          </div>
        );
      case "todo":
        return (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "3px 0", position: "relative" }}>
            {toolbar && <RichToolbar onFormat={handleFormat} />}
            <button
              onClick={() => h.onToggle(b.id)}
              style={{
                marginTop: 3, flexShrink: 0,
                width: 17, height: 17,
                borderRadius: 5,
                border: `1.5px solid ${b.checked ? "var(--accent)" : "var(--border-strong)"}`,
                background: b.checked ? "var(--accent)" : "transparent",
                cursor: "pointer",
                display: "grid", placeItems: "center",
                transition: "all 0.15s",
              }}
            >
              {b.checked && (
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 13 4.5 4.5L19 7" />
                </svg>
              )}
            </button>
            <div style={{
              flex: 1, fontSize: 15, lineHeight: 1.65,
              color: b.checked ? "var(--text-tertiary)" : "var(--text-primary)",
              textDecoration: b.checked ? "line-through" : "none",
              transition: "all 0.2s",
            }}>
              {editableEl}
            </div>
          </div>
        );
      case "bullet":
        return (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "2px 0", position: "relative" }}>
            {toolbar && <RichToolbar onFormat={handleFormat} />}
            <span style={{
              marginTop: 9, width: 6, height: 6, borderRadius: "50%",
              background: "var(--accent)", flexShrink: 0, display: "inline-block",
            }} />
            <div style={{ flex: 1, fontSize: 15, lineHeight: 1.65, color: "var(--text-primary)" }}>{editableEl}</div>
          </div>
        );
      case "numbered":
        return (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "2px 0", position: "relative" }}>
            {toolbar && <RichToolbar onFormat={handleFormat} />}
            <span style={{
              marginTop: 2, minWidth: "1.4em", textAlign: "right",
              fontFamily: "var(--font-mono)", fontSize: 13,
              fontWeight: 600, color: "var(--accent)", flexShrink: 0,
            }}>
              {num}.
            </span>
            <div style={{ flex: 1, fontSize: 15, lineHeight: 1.65, color: "var(--text-primary)" }}>{editableEl}</div>
          </div>
        );
      case "quote":
        return (
          <div style={{
            margin: "4px 0",
            borderLeft: "3px solid var(--accent)",
            paddingLeft: 16, paddingTop: 4, paddingBottom: 4,
            position: "relative",
          }}>
            {toolbar && <RichToolbar onFormat={handleFormat} />}
            <div style={{
              fontSize: 15.5, fontStyle: "italic",
              lineHeight: 1.65, color: "var(--text-secondary)",
            }}>{editableEl}</div>
          </div>
        );
      case "callout":
        return (
          <div style={{
            margin: "4px 0",
            display: "flex", alignItems: "flex-start", gap: 12,
            background: "var(--callout-bg)",
            border: `1px solid ${b.checked ? "var(--border)" : "var(--callout-border)"}`,
            borderRadius: 12, padding: "12px 14px",
            position: "relative",
          }}>
            {toolbar && <RichToolbar onFormat={handleFormat} />}
            <button
              onClick={() => h.onCalloutIcon(b.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 19, lineHeight: 1, padding: 0, marginTop: -1,
                transition: "transform 0.15s", flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {b.icon ?? "💡"}
            </button>
            <div style={{ flex: 1, fontSize: 14.5, lineHeight: 1.65, color: "var(--text-primary)" }}>{editableEl}</div>
          </div>
        );
      case "code":
        return <CodeBlock block={b} h={h} />;
      case "formula":
        return <FormulaBlock block={b} onChange={(expr) => h.onFormulaChange(b.id, expr)} />;
      case "table":
        return <TableBlock block={b} onChange={(rows) => h.onRowsChange(b.id, rows)} />;
      case "divider":
        return (
          <div style={{ padding: "10px 0" }}>
            <div style={{
              height: 2, borderRadius: 99,
              background: "linear-gradient(to right, var(--accent), transparent)",
              opacity: 0.35,
            }} />
          </div>
        );
      case "image": {
        return <ImageBlock block={b} h={h} />;
      }
      case "toggle":
        return <ToggleBlock block={b} h={h} editableEl={editableEl} />;
      default:
        return (
          <div style={{ padding: "2px 0", position: "relative" }}>
            {toolbar && <RichToolbar onFormat={handleFormat} />}
            <div style={{ fontSize: 15, lineHeight: 1.65, color: "var(--text-primary)" }}>{editableEl}</div>
          </div>
        );
    }
  })();

  return (
    <div
      ref={(node) => { setNodeRef(node); (wrapRef as React.MutableRefObject<HTMLDivElement | null>).current = node; }}
      data-block-id={b.id}
      style={{
        ...style,
        animation: `rise ${Math.min(i * 30, 360)}ms var(--ease-out) both`,
      }}
      className="group"
    >
      {/* ── Left controls (plus + drag handle) ── */}
      <div
        style={{
          position: "absolute",
          left: -44,
          top: 5,
          display: "flex",
          alignItems: "center",
          gap: 2,
          opacity: 0,
          transition: "opacity 0.15s",
          pointerEvents: "none",
        }}
        className="block-left-controls"
      >
        {/* + button */}
        <button
          onClick={() => h.onPlus(b.id)}
          title="Tambah blok"
          style={{
            width: 24, height: 24, borderRadius: 6,
            background: "transparent", border: "none",
            cursor: "pointer", display: "grid", placeItems: "center",
            color: "var(--text-tertiary)", transition: "all 0.12s",
            pointerEvents: "all",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* Drag handle / context menu trigger */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}
          title="Atur blok"
          style={{
            width: 24, height: 24, borderRadius: 6,
            background: menu ? "var(--bg-tertiary)" : "transparent",
            border: "none",
            cursor: "grab",
            display: "grid", placeItems: "center",
            color: menu ? "var(--text-primary)" : "var(--text-tertiary)",
            transition: "all 0.12s",
            pointerEvents: "all",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => {
            if (!menu) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6"  r="1.8" /><circle cx="15" cy="6"  r="1.8" />
            <circle cx="9" cy="12" r="1.8" /><circle cx="15" cy="12" r="1.8" />
            <circle cx="9" cy="18" r="1.8" /><circle cx="15" cy="18" r="1.8" />
          </svg>
        </button>

        {menu && (
          <BlockMenu blockId={b.id} onClose={() => setMenu(false)} h={h} />
        )}
      </div>

      {/* ── Block content ── */}
      <div
        onMouseEnter={() => {
          const el = wrapRef.current?.querySelector(".block-left-controls") as HTMLElement | null;
          if (el) el.style.opacity = "1";
        }}
        onMouseLeave={() => {
          const el = wrapRef.current?.querySelector(".block-left-controls") as HTMLElement | null;
          if (el) el.style.opacity = "0";
        }}
      >
        {content}
      </div>

      {/* ── Slash menu ── */}
      {slash && (
        <div style={{ position: "relative" }}>
          <SlashMenu
            query={slash.query}
            idx={slash.idx}
            items={slash.items}
            onIdx={slash.onIdx}
            onPick={slash.onPick}
          />
        </div>
      )}
    </div>
  );
}
