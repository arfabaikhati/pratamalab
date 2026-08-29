import { useCallback, useEffect, useState } from "react";
import type { Block, Page } from "../types";
import { stripHtml } from "../lib/util";
import { evalFormula, fmtNum } from "../lib/formula";
import { IcChevL, IcChevR, IcLogo, IcX } from "./icons";

interface Slide {
  title: string;
  blocks: Block[];
}

function buildSlides(page: Page): Slide[] {
  const slides: Slide[] = [];
  for (const b of page.blocks) {
    if (b.type === "h1" || b.type === "h2") {
      slides.push({ title: stripHtml(b.html) || "Tanpa judul", blocks: [] });
    } else {
      if (slides.length === 0)
        slides.push({ title: page.title || "Tanpa judul", blocks: [] });
      slides[slides.length - 1].blocks.push(b);
    }
  }
  if (slides.length === 0) slides.push({ title: page.title || "Tanpa judul", blocks: [] });
  return slides;
}

function RenderBlock({ b }: { b: Block }) {
  switch (b.type) {
    case "h3":
      return <p className="font-display text-2xl font-semibold text-honey">{stripHtml(b.html)}</p>;
    case "bullet":
      return (
        <p className="flex items-start gap-3 text-xl leading-relaxed text-white/85">
          <svg viewBox="0 0 8 8" width="10" height="10" className="mt-[11px] shrink-0"><circle cx="4" cy="4" r="4" className="fill-pine-bright" /></svg>
          <span>{stripHtml(b.html)}</span>
        </p>
      );
    case "numbered":
      return <p className="flex items-start gap-3 text-xl leading-relaxed text-white/85"><span className="mt-[2px] font-mono text-pine-bright">•</span><span>{stripHtml(b.html)}</span></p>;
    case "todo":
      return (
        <p className={`flex items-start gap-3 text-xl leading-relaxed ${b.checked ? "text-white/40 line-through" : "text-white/85"}`}>
          <span className={`mt-[6px] grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border-[1.5px] ${b.checked ? "border-pine-bright bg-pine text-white" : "border-white/40"}`}>
            {b.checked && (
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4.5 4.5L19 7" /></svg>
            )}
          </span>
          <span>{stripHtml(b.html)}</span>
        </p>
      );
    case "quote":
      return <p className="border-l-4 border-pine-bright pl-5 text-2xl italic leading-relaxed text-white/80">{stripHtml(b.html)}</p>;
    case "callout":
      return (
        <p className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-lg leading-relaxed text-white/85">
          <span className="text-xl">{b.icon ?? "💡"}</span>
          <span>{stripHtml(b.html)}</span>
        </p>
      );
    case "code":
      return <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-5 font-mono text-[13.5px] leading-relaxed text-[#9fe8d8]">{b.html}</pre>;
    case "formula": {
      const r = evalFormula(b.html);
      return (
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-mono text-lg text-white/50">{b.html} =</span>
          <span className="font-display text-4xl font-bold text-white">{r.ok ? fmtNum(r.value) : "…"}</span>
        </p>
      );
    }
    case "table": {
      const rows = b.rows ?? [];
      return (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full border-collapse text-left text-[15px]">
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i === 0 ? "bg-white/10 font-semibold text-white" : "text-white/80"}>
                  {row.map((c, j) => (
                    <td key={j} className="border border-white/10 px-4 py-2.5">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "divider":
      return <div className="h-px w-24 bg-white/20" />;
    default:
      return <p className="text-xl leading-relaxed text-white/85">{stripHtml(b.html)}</p>;
  }
}

export default function PresentMode({ page, onClose }: { page: Page; onClose: () => void }) {
  const [slides] = useState<Slide[]>(() => buildSlides(page));
  const [idx, setIdx] = useState(0);
  const n = slides.length;

  const next = useCallback(() => setIdx((i) => Math.min(n - 1, i + 1)), [n]);
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
      else if (e.key === "Home") setIdx(0);
      else if (e.key === "End") setIdx(n - 1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose, n]);

  const slide = slides[idx];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink text-paper animate-fadein">
      {/* ambient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize: "26px 26px" }}
      />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 animate-drift rounded-full bg-pine/15 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 animate-drift-2 rounded-full bg-honey/10 blur-[100px]" />

      {/* progress */}
      <div className="absolute left-0 top-0 h-[3px] bg-pine-bright transition-all duration-300" style={{ width: `${((idx + 1) / n) * 100}%` }} />

      {/* header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5 text-white/50">
          <IcLogo width={18} height={18} className="text-pine-bright" />
          <span className="font-display text-[13.5px] font-semibold text-white/70">{page.title || "Tanpa judul"}</span>
          <span className="rounded-md bg-white/8 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
            presentasi
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] text-white/40">
            {String(idx + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup presentasi"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-white/60 transition hover:bg-white/10 hover:text-white active:scale-90"
          >
            <IcX width={15} height={15} />
          </button>
        </div>
      </header>

      {/* panggung */}
      <main className="relative z-10 flex flex-1 items-center overflow-hidden px-6 sm:px-12">
        <div key={idx} className="mx-auto w-full max-w-4xl animate-slidein">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-pine-bright">
            Slide {idx + 1}
          </p>
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
            {slide.title}
            <span className="text-pine-bright">.</span>
          </h2>
          {slide.blocks.length > 0 && (
            <div className="mt-9 space-y-5">
              {slide.blocks.map((b) => (
                <RenderBlock key={b.id} b={b} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* kontrol */}
      <footer className="relative z-10 flex flex-col items-center gap-3 px-6 pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={prev}
            disabled={idx === 0}
            aria-label="Slide sebelumnya"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/10 hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-25"
          >
            <IcChevL width={17} height={17} />
          </button>
          <div className="flex items-center gap-1.5">
            {slides.slice(0, 14).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-pine-bright" : "w-1.5 bg-white/25 hover:bg-white/50"}`}
              />
            ))}
            {n > 14 && <span className="ml-1 font-mono text-[11px] text-white/40">+{n - 14}</span>}
          </div>
          <button
            type="button"
            onClick={next}
            disabled={idx === n - 1}
            aria-label="Slide berikutnya"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/10 hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-25"
          >
            <IcChevR width={17} height={17} />
          </button>
        </div>
        <p className="hidden items-center gap-2 text-[11px] text-white/30 sm:flex">
          <span className="kbd !border-white/15 !bg-white/5 !text-white/40">←</span>
          <span className="kbd !border-white/15 !bg-white/5 !text-white/40">→</span> navigasi
          <span className="mx-1 text-white/15">·</span>
          <span className="kbd !border-white/15 !bg-white/5 !text-white/40">esc</span> keluar
        </p>
      </footer>
    </div>
  );
}
