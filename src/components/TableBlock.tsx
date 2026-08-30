import type { Block } from "../types";
import { fmtNum } from "../lib/formula";
import { IcMinus, IcPlus } from "./icons";

export default function TableBlock({
  block,
  onChange,
}: {
  block: Block;
  onChange: (rows: string[][]) => void;
}) {
  const rows = block.rows && block.rows.length > 0 ? block.rows : [["", "", ""], ["", "", ""], ["", "", ""]];
  const cols = rows[0]?.length ?? 0;

  const set = (r: string[][]) => onChange(r);
  const setCell = (i: number, j: number, v: string) =>
    set(rows.map((row, ri) => (ri === i ? row.map((c, ci) => (ci === j ? v : c)) : row)));
  const addRow = () => set([...rows, Array(cols).fill("")]);
  const addCol = () => set(rows.map((r) => [...r, ""]));
  const delRow = () => rows.length > 1 && set(rows.slice(0, -1));
  const delCol = () => cols > 1 && set(rows.map((r) => r.slice(0, -1)));

  const sums: (number | null)[] = Array.from({ length: cols }, (_, j) => {
    const vals = rows.slice(1).map((r) => parseFloat((r[j] ?? "").replace(",", ".")));
    const filled = vals.filter((v) => !Number.isNaN(v));
    const nonEmpty = rows.slice(1).filter((r) => (r[j] ?? "").trim() !== "");
    if (filled.length === 0 || filled.length < Math.ceil(nonEmpty.length / 2)) return null;
    return filled.reduce((a, b) => a + b, 0);
  });
  const hasSum = sums.some((s) => s !== null);

  const toolBtn =
    "inline-flex items-center gap-1 rounded-md border border-line bg-card px-2 py-1 text-[11.5px] font-medium text-fade transition hover:border-pine/50 hover:bg-pine-soft hover:text-pine-deep active:scale-95 disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="group/tbl my-1">
      <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-sm">
        <table className="w-full border-collapse text-[13.5px]">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i === 0 ? "bg-paper/80" : ""}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`min-w-[110px] border border-line/70 p-0 ${i === 0 ? "font-semibold text-ink" : ""}`}
                  >
                    <input
                      value={cell}
                      onChange={(e) => setCell(i, j, e.target.value)}
                      placeholder={i === 0 ? "Kolom" : "…"}
                      spellCheck={false}
                      className="w-full bg-transparent px-3 py-2 text-body outline-none transition-colors placeholder:text-faint/60 focus:bg-pine-soft/50"
                    />
                  </td>
                ))}
              </tr>
            ))}
            {hasSum && (
              <tr className="bg-pine-soft/60 font-mono text-[12px] font-medium text-pine-deep">
                {sums.map((s, j) => (
                  <td key={j} className="border border-line/70 px-3 py-1.5">
                    {s !== null ? `Σ ${fmtNum(s)}` : j === 0 ? "Total" : "—"}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover/tbl:opacity-100">
        <button type="button" className={toolBtn} onClick={addRow}>
          <IcPlus size={12} /> Baris
        </button>
        <button type="button" className={toolBtn} onClick={addCol}>
          <IcPlus size={12} /> Kolom
        </button>
        <button type="button" className={toolBtn} onClick={delRow} disabled={rows.length <= 1}>
          <IcMinus size={12} /> Baris
        </button>
        <button type="button" className={toolBtn} onClick={delCol} disabled={cols <= 1}>
          <IcMinus size={12} /> Kolom
        </button>
        <span className="ml-1 hidden text-[11px] text-faint sm:inline">
          {rows.length} × {cols}
        </span>
      </div>
    </div>
  );
}
