import { useRef, useState, useEffect } from "react";
import type { Page } from "../types";
import { stripHtml, downloadFile, escapeHtml, sanitizeHtml } from "../lib/util";

interface Props {
  page: Page;
  onClose: () => void;
}

// ─── Converters ──────────────────────────────────────────────

function toMarkdown(page: Page): string {
  const lines: string[] = [`# ${page.icon} ${page.title}`, ""];

  for (const b of page.blocks) {
    const text = stripHtml(b.html);
    switch (b.type) {
      case "h1":      lines.push(`# ${text}`, ""); break;
      case "h2":      lines.push(`## ${text}`, ""); break;
      case "h3":      lines.push(`### ${text}`, ""); break;
      case "bullet":  lines.push(`- ${text}`); break;
      case "numbered":lines.push(`1. ${text}`); break;
      case "todo":    lines.push(`- [${b.checked ? "x" : " "}] ${text}`); break;
      case "quote":   lines.push(`> ${text}`, ""); break;
      case "callout": lines.push(`> ${b.icon ?? "💡"} **${text}**`, ""); break;
      case "code":    lines.push(`\`\`\`${b.lang ?? ""}\n${b.html}\n\`\`\``, ""); break;
      case "formula": lines.push(`*Rumus: ${b.html}*`, ""); break;
      case "divider": lines.push("---", ""); break;
      case "table": {
        if (!b.rows?.length) break;
        for (let r = 0; r < b.rows.length; r++) {
          lines.push("| " + b.rows[r].join(" | ") + " |");
          if (r === 0) lines.push("|" + b.rows[0].map(() => "---|").join(""));
        }
        lines.push("");
        break;
      }
      default:
        if (text) { lines.push(text, ""); }
    }
  }
  return lines.join("\n");
}

function toHtml(page: Page): string {
  const rows2html = (rows: string[][]): string => {
    if (!rows.length) return "";
    const header = `<tr>${rows[0].map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`;
    const body   = rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("");
    return `<table><thead>${header}</thead><tbody>${body}</tbody></table>`;
  };

  const blocks = page.blocks.map((b) => {
    const t = sanitizeHtml(b.html);
    switch (b.type) {
      case "h1":       return `<h1>${t}</h1>`;
      case "h2":       return `<h2>${t}</h2>`;
      case "h3":       return `<h3>${t}</h3>`;
      case "bullet":   return `<li>${t}</li>`;
      case "numbered": return `<li>${t}</li>`;
      case "todo":     return `<li><input type="checkbox" ${b.checked ? "checked" : ""} disabled> ${t}</li>`;
      case "quote":    return `<blockquote>${t}</blockquote>`;
      case "callout":  return `<aside class="callout">${b.icon ?? "💡"} ${t}</aside>`;
      case "code":     return `<pre><code class="language-${escapeHtml(b.lang ?? "text")}">${escapeHtml(b.html)}</code></pre>`;
      case "divider":  return `<hr>`;
      case "table":    return b.rows ? rows2html(b.rows) : "";
      default:         return t ? `<p>${t}</p>` : "";
    }
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(page.icon)} ${escapeHtml(page.title)}</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;color:#111;line-height:1.7}
    h1{font-size:2rem;margin-bottom:.25em}h2{font-size:1.45rem}h3{font-size:1.2rem}
    blockquote{border-left:3px solid #6366f1;margin:0;padding:4px 16px;color:#555;font-style:italic}
    pre{background:#0f172a;color:#e2e8f0;padding:16px;border-radius:10px;overflow-x:auto}
    code{font-family:monospace;font-size:.9em}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #e5e7eb;padding:8px 12px;text-align:left}
    th{background:#f9fafb;font-weight:600}
    .callout{background:#fffbeb;border:1px solid #fbbf24;border-radius:10px;padding:12px 16px}
    hr{border:none;border-top:2px solid #e5e7eb;margin:24px 0}
    li{margin-bottom:4px}
  </style>
</head>
<body>
  <h1>${escapeHtml(page.icon)} ${escapeHtml(page.title)}</h1>
  ${blocks}
</body>
</html>`;
}

function toCsv(page: Page): string {
  const tables = page.blocks.filter((block) => block.type === "table" && block.rows?.length);
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return tables
    .flatMap((table, index) => [
      ...(tables.length > 1 ? [[`Tabel ${index + 1}`]] : []),
      ...(table.rows ?? []),
      [],
    ])
    .map((row) => row.map(quote).join(","))
    .join("\r\n");
}

function toJson(page: Page): string {
  return JSON.stringify({ title: page.title, icon: page.icon, blocks: page.blocks }, null, 2);
}

// ─── Component ───────────────────────────────────────────────

const OPTIONS = [
  { id: "markdown", label: "Markdown", icon: "📝", ext: ".md",   mime: "text/markdown" },
  { id: "html",     label: "HTML",     icon: "🌐", ext: ".html", mime: "text/html" },
  { id: "json",     label: "JSON",     icon: "📦", ext: ".json", mime: "application/json" },
  { id: "csv",      label: "CSV (tabel)", icon: "📊", ext: ".csv", mime: "text/csv" },
  { id: "print",    label: "PDF / Cetak", icon: "🖨️", ext: "",   mime: "" },
];

export default function ExportMenu({ page, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleExport = (id: string) => {
    const safeName = page.title.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "pratamalab";

    if (id === "markdown") {
      downloadFile(toMarkdown(page), `${safeName}.md`, "text/markdown");
    } else if (id === "html") {
      downloadFile(toHtml(page), `${safeName}.html`, "text/html");
    } else if (id === "json") {
      downloadFile(toJson(page), `${safeName}.json`, "application/json");
    } else if (id === "csv") {
      if (!page.blocks.some((block) => block.type === "table" && block.rows?.length)) return;
      downloadFile(`\uFEFF${toCsv(page)}`, `${safeName}.csv`, "text/csv;charset=utf-8");
    } else if (id === "print") {
      window.print();
    }
    onClose();
  };

  return (
    <div
      ref={ref}
      className="slash-menu"
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        right: 0,
        zIndex: 200,
        minWidth: 210,
        padding: "6px",
      }}
    >
      <p style={{
        margin: "4px 8px 8px",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--text-tertiary)",
      }}>
        Ekspor halaman
      </p>
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => handleExport(opt.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "9px 10px",
            border: "none",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.15s",
            color: "var(--text-primary)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: 17 }}>{opt.icon}</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{opt.label}</div>
            {opt.ext && (
              <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                {opt.ext} &middot; {opt.mime.split("/")[1].toUpperCase()}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
