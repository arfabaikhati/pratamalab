import type { SlashDef } from "../types";
import { iconFor } from "./icons";

interface Props {
  items: SlashDef[];
  idx: number;
  onIdx: (i: number) => void;
  onPick: (d: SlashDef) => void;
  query: string;
}

export default function SlashMenu({ items, idx, onIdx, onPick, query }: Props) {
  return (
    <div className="absolute left-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-3rem))] animate-pop overflow-hidden rounded-xl border border-line bg-card shadow-[0_16px_40px_-12px_rgba(21,24,29,0.28)]">
      <div className="flex items-center justify-between border-b border-line/70 px-3.5 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-fade">
          Sisipkan blok
        </span>
        {query && (
          <span className="rounded-md bg-pine-soft px-1.5 py-0.5 font-mono text-[10.5px] text-pine-deep">
            /{query}
          </span>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto p-1.5">
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-[13px] font-medium text-fade">Tidak ada blok “{query}”</p>
            <p className="mt-1 text-[12px] text-faint">Coba kata lain: tabel, rumus, kutipan…</p>
          </div>
        ) : (
          items.map((d, i) => (
            <button
              key={d.type}
              type="button"
              onMouseEnter={() => onIdx(i)}
              onClick={() => onPick(d)}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                i === idx ? "bg-pine-soft" : "hover:bg-paper"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors ${
                  i === idx
                    ? "border-pine/40 bg-card text-pine-deep"
                    : "border-line bg-card text-fade"
                }`}
              >
                {iconFor(d.type)}
              </span>
              <span className="min-w-0">
                <span className={`block text-[13.5px] font-semibold ${i === idx ? "text-pine-deep" : "text-ink"}`}>
                  {d.label}
                </span>
                <span className="block truncate text-[11.5px] text-fade">{d.desc}</span>
              </span>
            </button>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-line/70 bg-paper/60 px-3.5 py-2 text-[10.5px] text-faint">
        <span className="kbd">↑↓</span> navigasi
        <span className="kbd">↵</span> pilih
        <span className="kbd">esc</span> tutup
      </div>
    </div>
  );
}
