import { useMemo, useRef } from "react";
import type { Block } from "../types";
import { evalFormula, fmtNum } from "../lib/formula";
import { IcSigma } from "./icons";

const CHIPS: { label: string; insert: string }[] = [
  { label: "π", insert: "pi" },
  { label: "e", insert: "e" },
  { label: "√", insert: "sqrt(" },
  { label: "x^y", insert: "^" },
  { label: "sin", insert: "sin(" },
  { label: "cos", insert: "cos(" },
  { label: "log", insert: "log(" },
  { label: "min", insert: "min(" },
  { label: "max", insert: "max(" },
  { label: "( )", insert: "()" },
];

export default function FormulaBlock({
  block,
  onChange,
}: {
  block: Block;
  onChange: (expr: string) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const result = useMemo(() => evalFormula(block.html), [block.html]);

  const insert = (text: string) => {
    const el = ref.current;
    const expr = block.html;
    const s = el?.selectionStart ?? expr.length;
    const e2 = el?.selectionEnd ?? s;
    const next = expr.slice(0, s) + text + expr.slice(e2);
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const p = s + text.length;
      el.setSelectionRange(p, p);
    });
  };

  return (
    <div className="my-1 rounded-xl border border-line bg-card px-4 pb-3.5 pt-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-pine-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-pine-deep">
          <IcSigma width={11} height={11} /> Rumus
        </span>
        <div className="hidden flex-wrap items-center gap-1 sm:flex">
          {CHIPS.map((c) => (
            <button
              key={c.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(c.insert)}
              className="rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] text-fade transition hover:border-pine/50 hover:bg-pine-soft hover:text-pine-deep active:scale-95"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={ref}
        value={block.html}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tulis ekspresi… contoh: (1250000 * 12) * 1.06"
        spellCheck={false}
        className="mt-2.5 w-full bg-transparent font-mono text-[14px] text-body outline-none placeholder:text-faint"
      />

      <div className="mt-3 border-t border-dashed border-line pt-2.5">
        {block.html.trim() === "" ? (
          <p className="text-[12.5px] text-faint">
            Hasil muncul di sini — coba <span className="font-mono text-fade">2^10 + sqrt(81)</span>
          </p>
        ) : result.ok ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 animate-pop" key={fmtNum(result.value)}>
            <span className="font-mono text-[13px] text-faint">=</span>
            <span className="font-display text-[26px] font-bold leading-none tracking-tight text-ink">
              {fmtNum(result.value)}
            </span>
            <span className="font-mono text-[11px] text-faint">
              {result.value.toPrecision(10).replace(/\.?0+$/, "")}
            </span>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-danger">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 4 2.8 20h18.4L12 4Z" />
              <path d="M12 10v4M12 17.2v.1" />
            </svg>
            {result.error}
          </p>
        )}
      </div>
    </div>
  );
}
