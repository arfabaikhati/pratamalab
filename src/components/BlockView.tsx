import { useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Block, FocusReq, SlashDef } from "../types";
import Editable from "./Editable";
import FormulaBlock from "./FormulaBlock";
import TableBlock from "./TableBlock";
import SlashMenu from "./SlashMenu";
import {
  IcArrowDown, IcArrowUp, IcCopy, IcGrip, IcPlus, IcTrash,
} from "./icons";

export interface BlockHandlers {
  onChange: (id: string, html: string, plain: string) => void;
  onEnter: (id: string, offset: number) => void;
  onBackspaceStart: (id: string) => void;
  onArrow: (id: string, dir: "up" | "down") => void;
  onSlashKey: (id: string, e: ReactKeyboardEvent<HTMLDivElement>) => boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onPlus: (id: string) => void;
  onFormulaChange: (id: string, expr: string) => void;
  onRowsChange: (id: string, rows: string[][]) => void;
  onCodeChange: (id: string, code: string) => void;
  onCodeLang: (id: string, lang: string) => void;
  onCalloutIcon: (id: string) => void;
  onToast: (msg: string) => void;
  focusReq: FocusReq | null;
}

export interface SlashState {
  query: string;
  idx: number;
  items: SlashDef[];
  onIdx: (i: number) => void;
  onPick: (d: SlashDef) => void;
}

const PH: Partial<Record<Block["type"], string>> = {
  text: "Ketik sesuatu, atau tekan / untuk perintah…",
  h1: "Judul 1",
  h2: "Judul 2",
  h3: "Judul 3",
  todo: "Tulis tugas…",
  bullet: "Tulis poin…",
  numbered: "Tulis poin bernomor…",
  quote: "Tulis kutipan…",
  callout: "Tulis sorotan…",
};

const LANGS = ["js", "ts", "python", "sql", "html", "css", "bash", "json"];

function CodeBlock({ block, h }: { block: Block; h: BlockHandlers }) {
  const lines = Math.max(3, block.html.split("\n").length);
  return (
    <div className="my-1 overflow-hidden rounded-xl border border-ink-line bg-ink shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b border-ink-line px-3.5 py-1.5">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-[#3a4250]" />
            <span className="h-2 w-2 rounded-full bg-[#3a4250]" />
            <span className="h-2 w-2 rounded-full bg-pine/70" />
          </span>
          <select
            value={block.lang ?? "js"}
            onChange={(e) => h.onCodeLang(block.id, e.target.value)}
            className="cursor-pointer bg-transparent font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/40 outline-none transition-colors hover:text-white/70"
          >
            {LANGS.map((l) => (
              <option key={l} value={l} className="bg-ink text-white/80">{l}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(block.html).then(
              () => h.onToast("Kode disalin ke clipboard"),
              () => h.onToast("Gagal menyalin kode")
            );
          }}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-white/40 transition hover:bg-white/10 hover:text-white/80 active:scale-95"
        >
          <IcCopy width={12} height={12} /> Salin
        </button>
      </div>
      <textarea
        value={block.html}
        onChange={(e) => h.onCodeChange(block.id, e.target.value)}
        rows={lines}
        spellCheck={false}
        placeholder="// tulis kode di sini…"
        className="block w-full resize-none bg-transparent p-3.5 font-mono text-[13px] leading-relaxed text-[#d8e3dd] outline-none placeholder:text-white/25"
      />
    </div>
  );
}

export default function BlockView({
  block: b, i, num, h, slash,
}: {
  block: Block;
  i: number;
  num?: number;
  h: BlockHandlers;
  slash?: SlashState | null;
}) {
  const [menu, setMenu] = useState(false);
  const editable = !["code", "formula", "table", "divider"].includes(b.type);
  const focusReq = h.focusReq && h.focusReq.id === b.id ? h.focusReq : null;

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
    />
  );

  const content = (() => {
    switch (b.type) {
      case "h1":
        return <div className="pt-4 pb-1 font-display text-[1.85rem] font-bold leading-tight tracking-tight text-ink">{editableEl}</div>;
      case "h2":
        return (
          <div className="flex items-baseline gap-2.5 pt-4 pb-0.5">
            <span className="h-[7px] w-[7px] shrink-0 translate-y-[-2px] rounded-[2.5px] bg-pine" />
            <div className="font-display text-[1.4rem] font-bold leading-snug tracking-tight text-ink">{editableEl}</div>
          </div>
        );
      case "h3":
        return <div className="pt-2.5 font-display text-[1.13rem] font-semibold text-ink">{editableEl}</div>;
      case "todo":
        return (
          <div className="flex items-start gap-2.5 py-[3px]">
            <button
              type="button"
              onClick={() => h.onToggle(b.id)}
              aria-label="centang tugas"
              className={`mt-[3px] grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-all duration-150 active:scale-90 ${
                b.checked ? "border-pine bg-pine text-white" : "border-faint bg-transparent hover:border-pine"
              }`}
            >
              {b.checked && (
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 13 4.5 4.5L19 7" />
                </svg>
              )}
            </button>
            <div className={`min-w-0 flex-1 text-[15px] leading-relaxed transition-all duration-200 ${b.checked ? "text-faint line-through" : "text-body"}`}>
              {editableEl}
            </div>
          </div>
        );
      case "bullet":
        return (
          <div className="flex items-start gap-2.5 py-[3px]">
            <svg viewBox="0 0 8 8" width="7" height="7" className="mt-[9px] shrink-0">
              <circle cx="4" cy="4" r="3.4" className="fill-pine" />
            </svg>
            <div className="min-w-0 flex-1 text-[15px] leading-relaxed text-body">{editableEl}</div>
          </div>
        );
      case "numbered":
        return (
          <div className="flex items-start gap-2.5 py-[3px]">
            <span className="mt-[2px] min-w-[1.3em] shrink-0 text-right font-mono text-[13px] font-semibold text-pine-deep">{num}.</span>
            <div className="min-w-0 flex-1 text-[15px] leading-relaxed text-body">{editableEl}</div>
          </div>
        );
      case "quote":
        return (
          <div className="my-1 border-l-[3px] border-ink py-1 pl-4 text-[15.5px] italic leading-relaxed text-ink-3">
            {editableEl}
          </div>
        );
      case "callout":
        return (
          <div className="my-1 flex items-start gap-3 rounded-xl border border-honey/50 bg-honey-soft px-3.5 py-3">
            <button
              type="button"
              onClick={() => h.onCalloutIcon(b.id)}
              title="Ganti ikon"
              className="mt-[-2px] text-[19px] leading-none transition-transform hover:scale-125 active:scale-95"
            >
              {b.icon ?? "💡"}
            </button>
            <div className="min-w-0 flex-1 text-[14.5px] leading-relaxed text-body">{editableEl}</div>
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
          <div className="py-2.5">
            <div className="h-[2px] rounded-full bg-gradient-to-r from-line via-line to-transparent transition-colors hover:from-pine/50" />
          </div>
        );
      default:
        return <div className="py-[3px] text-[15px] leading-relaxed text-body">{editableEl}</div>;
    }
  })();

  return (
    <div className="group relative animate-rise" style={{ animationDelay: `${Math.min(i * 28, 340)}ms` }}>
      {/* kontrol kiri */}
      <div className="absolute -left-11 top-[5px] hidden items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:flex">
        <button
          type="button"
          title="Tambah blok"
          onClick={() => h.onPlus(b.id)}
          className="grid h-6 w-6 place-items-center rounded-md text-faint transition hover:bg-line/70 hover:text-ink active:scale-90"
        >
          <IcPlus width={14} height={14} />
        </button>
        <button
          type="button"
          title="Atur blok"
          onClick={() => setMenu((m) => !m)}
          className={`grid h-6 w-6 cursor-grab place-items-center rounded-md transition active:scale-90 ${menu ? "bg-line/80 text-ink" : "text-faint hover:bg-line/70 hover:text-ink"}`}
        >
          <IcGrip width={14} height={14} />
        </button>
      </div>

      {/* popover aksi blok */}
      {menu && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
          <div className="absolute -left-11 top-8 z-30 w-44 animate-pop rounded-xl border border-line bg-card p-1.5 shadow-[0_14px_36px_-10px_rgba(21,24,29,0.25)]">
            {(
              [
                ["up", "Geser naik", <IcArrowUp key="u" width={13} height={13} />],
                ["down", "Geser turun", <IcArrowDown key="d" width={13} height={13} />],
                ["dup", "Duplikat", <IcCopy key="c" width={13} height={13} />],
              ] as const
            ).map(([act, label, icon]) => (
              <button
                key={act}
                type="button"
                onClick={() => {
                  setMenu(false);
                  if (act === "up") h.onMove(b.id, "up");
                  if (act === "down") h.onMove(b.id, "down");
                  if (act === "dup") h.onDuplicate(b.id);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-medium text-body transition hover:bg-paper active:scale-[0.98]"
              >
                <span className="text-fade">{icon}</span> {label}
              </button>
            ))}
            <div className="mx-1.5 my-1 h-px bg-line/80" />
            <button
              type="button"
              onClick={() => { setMenu(false); h.onDelete(b.id); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-medium text-danger transition hover:bg-danger-soft active:scale-[0.98]"
            >
              <IcTrash width={13} height={13} /> Hapus
            </button>
          </div>
        </>
      )}

      <div className="relative">
        {content}
        {slash && <SlashMenu items={slash.items} idx={slash.idx} onIdx={slash.onIdx} onPick={slash.onPick} query={slash.query} />}
      </div>
    </div>
  );
}
