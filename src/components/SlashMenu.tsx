import { useEffect, useRef } from "react";
import type { SlashDef } from "../types";
import { iconFor } from "./icons";

interface Props {
  query: string;
  idx: number;
  items: SlashDef[];
  onIdx: (i: number) => void;
  onPick: (d: SlashDef) => void;
}

const GROUPS: Record<string, string> = {
  Teks: "📝", Judul: "🔤", List: "📋",
  Media: "🖼", Data: "📊", Lainnya: "✨",
};

export default function SlashMenu({ query, idx, items, onIdx, onPick }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-slash-idx="${idx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  if (items.length === 0) {
    return (
      <div
        className="slash-menu"
        style={{
          position: "absolute", top: "100%", left: 0,
          zIndex: 200, padding: "10px 12px", minWidth: 220,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-tertiary)" }}>
          Tidak ada blok untuk <strong>/{query}</strong>
        </p>
      </div>
    );
  }

  // Group by block group
  const grouped: Record<string, SlashDef[]> = {};
  for (const item of items) {
    const g = item.group ?? "Lainnya";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(item);
  }

  let globalIdx = 0;

  return (
    <div
      className="slash-menu"
      ref={listRef}
      style={{
        position: "absolute", top: "100%", left: 0,
        zIndex: 200, minWidth: 260, maxWidth: 320,
        maxHeight: 360, overflowY: "auto",
        padding: "6px",
      }}
    >
      {query && (
        <div style={{
          padding: "3px 8px 6px",
          fontSize: 11, fontWeight: 700,
          color: "var(--text-tertiary)",
          letterSpacing: "0.06em",
        }}>
          / {query}
        </div>
      )}

      {Object.entries(grouped).map(([group, groupItems]) => (
        <div key={group}>
          <div style={{
            padding: "4px 8px 3px",
            fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--text-tertiary)",
          }}>
            {group}
          </div>
          {groupItems.map((item) => {
            const myIdx = globalIdx++;
            const active = myIdx === idx;
            return (
              <button
                key={item.type}
                data-slash-idx={myIdx}
                onClick={() => onPick(item)}
                onMouseEnter={() => onIdx(myIdx)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "8px 10px",
                  border: "none", borderRadius: 8,
                  background: active ? "var(--accent-soft)" : "transparent",
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.1s",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: active ? "var(--accent)" : "var(--bg-tertiary)",
                  display: "grid", placeItems: "center",
                  color: active ? "#fff" : "var(--text-secondary)",
                  flexShrink: 0, transition: "all 0.12s",
                }}>
                  {iconFor(item.type)}
                </span>
                <div>
                  <div style={{
                    fontSize: 13.5, fontWeight: 600,
                    color: active ? "var(--accent-dark)" : "var(--text-primary)",
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 1 }}>
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
