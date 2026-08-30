import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Block, Page } from "../types";
import { stripHtml } from "../lib/util";

// ─── Slide builder ───────────────────────────────────────────

interface Slide {
  title: string;
  titleType: "h1" | "h2" | "page";
  body: Block[];
  index: number;
}

function buildSlides(page: Page): Slide[] {
  const slides: Slide[] = [];
  let current: Slide = {
    title: page.title || "Tanpa Judul",
    titleType: "page",
    body: [],
    index: 0,
  };

  for (const block of page.blocks) {
    if (block.type === "h1" || block.type === "h2") {
      if (current.body.length > 0 || slides.length > 0) {
        slides.push(current);
        current = {
          title: stripHtml(block.html) || (block.type === "h1" ? "Judul 1" : "Judul 2"),
          titleType: block.type,
          body: [],
          index: slides.length,
        };
      } else {
        current.title = stripHtml(block.html) || page.title;
        current.titleType = block.type;
      }
    } else if (block.type !== "divider") {
      current.body.push(block);
    }
  }
  slides.push(current);
  return slides;
}

// ─── Block renderer in presentation ──────────────────────────

function SlideBlock({ block }: { block: Block }) {
  const text = stripHtml(block.html);
  const base: React.CSSProperties = { marginBottom: 10 };

  switch (block.type) {
    case "h3":
      return <h3 style={{ ...base, fontSize: "1.3rem", fontWeight: 700, color: "#f0f1f6", fontFamily: "var(--font-display)" }}>{text}</h3>;
    case "bullet":
      return (
        <div style={{ ...base, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ marginTop: 10, width: 7, height: 7, borderRadius: "50%", background: "#818cf8", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.65 }}>{text}</span>
        </div>
      );
    case "numbered":
      return (
        <div style={{ ...base, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", color: "#818cf8", marginTop: 2, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.65 }}>{text}</span>
        </div>
      );
    case "todo":
      return (
        <div style={{ ...base, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 18, height: 18, borderRadius: 5,
            border: `2px solid ${block.checked ? "#818cf8" : "rgba(255,255,255,0.3)"}`,
            background: block.checked ? "#6366f1" : "transparent",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            {block.checked && (
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <path d="m5 13 4.5 4.5L19 7" />
              </svg>
            )}
          </div>
          <span style={{
            fontSize: "1.05rem",
            color: block.checked ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.88)",
            textDecoration: block.checked ? "line-through" : "none",
            lineHeight: 1.6,
          }}>{text}</span>
        </div>
      );
    case "quote":
      return (
        <blockquote style={{
          ...base,
          borderLeft: "3px solid #6366f1",
          paddingLeft: 16, margin: "12px 0",
          fontStyle: "italic", fontSize: "1.05rem",
          color: "rgba(255,255,255,0.7)", lineHeight: 1.65,
        }}>
          {text}
        </blockquote>
      );
    case "callout":
      return (
        <div style={{
          ...base,
          display: "flex", gap: 12,
          background: "rgba(99,102,241,0.12)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 12, padding: "12px 16px",
        }}>
          <span style={{ fontSize: 20 }}>{block.icon ?? "💡"}</span>
          <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.65 }}>{text}</span>
        </div>
      );
    case "code":
      return (
        <pre style={{
          ...base,
          background: "rgba(0,0,0,0.4)",
          borderRadius: 10, padding: "14px 16px",
          fontFamily: "var(--font-mono)", fontSize: "0.88rem",
          color: "#e2e8f0", overflowX: "auto",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          {block.html}
        </pre>
      );
    case "table": {
      if (!block.rows?.length) return null;
      return (
        <div style={{ ...base, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.92rem" }}>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => {
                    const Tag = ri === 0 ? "th" : "td";
                    return (
                      <Tag
                        key={ci}
                        style={{
                          border: "1px solid rgba(255,255,255,0.12)",
                          padding: "8px 14px",
                          background: ri === 0 ? "rgba(99,102,241,0.2)" : "transparent",
                          color: ri === 0 ? "#c7d2fe" : "rgba(255,255,255,0.82)",
                          fontWeight: ri === 0 ? 700 : 400,
                          textAlign: "left",
                        }}
                      >
                        {cell}
                      </Tag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    default:
      return text ? (
        <p style={{ ...base, fontSize: "1.05rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.7 }}>
          {text}
        </p>
      ) : null;
  }
}

// ─── Main component ──────────────────────────────────────────

interface Props {
  page: Page;
  onClose: () => void;
}

export default function PresentMode({ page, onClose }: Props) {
  const slides = buildSlides(page);
  const [idx, setIdx] = useState(0);
  const [dir, setDir]  = useState<1 | -1>(1);

  const go = useCallback((delta: 1 | -1) => {
    setIdx((i) => {
      const next = Math.max(0, Math.min(slides.length - 1, i + delta));
      if (next !== i) setDir(delta);
      return next;
    });
  }, [slides.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault(); go(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault(); go(-1);
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Home") {
        setIdx(0); setDir(1);
      } else if (e.key === "End") {
        setIdx(slides.length - 1); setDir(-1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go, onClose, slides.length]);

  const slide = slides[idx];
  const progress = slides.length > 1 ? (idx / (slides.length - 1)) * 100 : 100;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "60px" : "-60px", opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit:  (d: number) => ({ x: d > 0 ? "-60px" : "60px", opacity: 0, scale: 0.97 }),
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "#090b13",
        display: "flex", flexDirection: "column",
        userSelect: "none",
      }}
    >
      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(to right, #6366f1, #8b5cf6)",
          transition: "width 0.3s var(--ease-out)",
          borderRadius: "0 99px 99px 0",
        }} />
      </div>

      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{page.icon}</span>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
            {page.title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>
            {idx + 1} / {slides.length}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "6px 14px",
              color: "rgba(255,255,255,0.7)",
              fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            Keluar (Esc)
          </button>
        </div>
      </div>

      {/* Slide area */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "0 80px" }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={idx}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "100%", maxWidth: 900,
              maxHeight: "75vh", overflowY: "auto",
            }}
          >
            {/* Slide title */}
            <div style={{ marginBottom: 28 }}>
              {slide.titleType === "page" ? (
                <h1 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  fontWeight: 800, color: "#fff", margin: 0,
                  letterSpacing: "-0.02em", lineHeight: 1.1,
                }}>
                  {page.icon} {slide.title}
                </h1>
              ) : slide.titleType === "h1" ? (
                <h1 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  fontWeight: 800, color: "#fff", margin: 0,
                  letterSpacing: "-0.02em", lineHeight: 1.1,
                }}>
                  {slide.title}
                </h1>
              ) : (
                <h2 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  fontWeight: 700, color: "#c7d2fe", margin: 0,
                  lineHeight: 1.2,
                }}>
                  {slide.title}
                </h2>
              )}
              {idx === 0 && slide.titleType === "page" && (
                <div style={{
                  marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.35)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>Tekan</span>
                  <kbd style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>→</kbd>
                  <span>untuk lanjut</span>
                </div>
              )}
            </div>

            {/* Slide body */}
            {slide.body.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {slide.body.map((block) => (
                  <SlideBlock key={block.id} block={block} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 24, padding: "20px 24px", flexShrink: 0,
      }}>
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: idx === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: idx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.8)",
            cursor: idx === 0 ? "not-allowed" : "pointer",
            display: "grid", placeItems: "center",
            transition: "all 0.15s", fontSize: 18,
          }}
        >
          ‹
        </button>

        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {slides.slice(0, 12).map((_, i) => (
            <button
              key={i}
              onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }}
              style={{
                width: i === idx ? 22 : 7,
                height: 7, borderRadius: 99,
                background: i === idx ? "#6366f1" : "rgba(255,255,255,0.2)",
                border: "none", cursor: "pointer",
                transition: "all 0.2s",
                padding: 0,
              }}
            />
          ))}
          {slides.length > 12 && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>
              +{slides.length - 12}
            </span>
          )}
        </div>

        <button
          onClick={() => go(1)}
          disabled={idx === slides.length - 1}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: idx === slides.length - 1 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: idx === slides.length - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.8)",
            cursor: idx === slides.length - 1 ? "not-allowed" : "pointer",
            display: "grid", placeItems: "center",
            transition: "all 0.15s", fontSize: 18,
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}
