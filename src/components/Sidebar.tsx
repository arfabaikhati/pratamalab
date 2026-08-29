import { useEffect, useState } from "react";
import type { Page } from "../types";
import { timeAgo } from "../lib/util";
import { IcLogo, IcPlus, IcSearch, IcSpark, IcTrash } from "./icons";

interface Props {
  pages: Page[];
  activeId: string | null;
  totalBlocks: number;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({ pages, activeId, totalBlocks, onSelect, onCreate, onDelete }: Props) {
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmId) return;
    const t = setTimeout(() => setConfirmId(null), 2600);
    return () => clearTimeout(t);
  }, [confirmId]);

  const filtered = pages.filter((p) =>
    p.title.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <aside className="flex h-full w-[268px] shrink-0 flex-col bg-ink text-[#c3c9d2]">
      {/* brand */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-pine text-[#e9f5f2] shadow-[0_4px_14px_-4px_rgba(14,133,120,0.7)]">
          <IcLogo width={20} height={20} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-[17px] font-bold tracking-tight text-[#f2f1ec]">
            pratama<span className="text-pine-bright">lab</span>
          </p>
          <p className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-white/30">
            ruang kerja fleksibel
          </p>
        </div>
      </div>

      {/* cari */}
      <div className="mx-3 flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 transition-colors focus-within:border-pine/60 focus-within:bg-white/[0.07]">
        <IcSearch width={14} height={14} className="shrink-0 text-white/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari halaman…"
          className="w-full bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/30"
        />
      </div>

      {/* daftar halaman */}
      <div className="mt-5 flex items-center justify-between px-4 pb-1.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/30">
          Halaman
        </span>
        <span className="rounded-md bg-white/8 px-1.5 py-0.5 font-mono text-[10.5px] text-white/40">
          {pages.length}
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center">
            <IcSpark width={18} height={18} className="mx-auto text-white/25" />
            <p className="mt-2.5 text-[12.5px] text-white/35">
              {pages.length === 0 ? "Belum ada halaman" : `Tidak ada hasil untuk “${q}”`}
            </p>
          </div>
        )}
        {filtered.map((p) => {
          const active = p.id === activeId;
          return (
            <div key={p.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className={`relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13.5px] transition-all duration-150 ${
                  active
                    ? "bg-white/10 font-semibold text-white"
                    : "text-white/70 hover:translate-x-[2px] hover:bg-white/5 hover:text-white/90"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-pine-bright" />
                )}
                <span className="text-[15px] leading-none">{p.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{p.title || "Tanpa judul"}</span>
                  <span className={`block text-[10.5px] ${active ? "text-white/40" : "text-white/25"}`}>
                    {timeAgo(p.updatedAt)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                title="Hapus halaman"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirmId === p.id) {
                    setConfirmId(null);
                    onDelete(p.id);
                  } else setConfirmId(p.id);
                }}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10.5px] font-semibold transition-all ${
                  confirmId === p.id
                    ? "bg-danger text-white opacity-100"
                    : "text-white/30 opacity-0 hover:bg-white/10 hover:text-danger group-hover:opacity-100"
                }`}
              >
                {confirmId === p.id ? "Yakin?" : <IcTrash width={13} height={13} />}
              </button>
            </div>
          );
        })}
      </nav>

      {/* halaman baru */}
      <button
        type="button"
        onClick={onCreate}
        className="mx-3 mb-3 flex h-9 items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 text-[13px] font-medium text-white/60 transition-all hover:border-pine/60 hover:bg-pine/10 hover:text-white active:scale-[0.98]"
      >
        <IcPlus width={14} height={14} /> Halaman baru
      </button>

      {/* footer */}
      <div className="border-t border-white/8 px-4 py-3">
        <p className="font-mono text-[11px] text-white/35">
          {pages.length} halaman · {totalBlocks} blok
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine-bright opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pine-bright" />
          </span>
          Tersimpan otomatis di perangkat ini
        </p>
      </div>
    </aside>
  );
}
