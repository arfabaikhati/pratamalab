export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function stripHtml(html: string): string {
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent ?? "").replace(/\u00a0/g, " ");
}

export function countWords(html: string): number {
  const t = stripHtml(html).trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 45_000) return "baru saja";
  if (d < 3_600_000) return `${Math.max(1, Math.round(d / 60_000))} mnt lalu`;
  if (d < 86_400_000) return `${Math.round(d / 3_600_000)} jam lalu`;
  if (d < 172_800_000) return "kemarin";
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const PAGE_ICONS = [
  "📄", "📓", "🧪", "⚗️", "📊", "🧮", "🎯", "💡",
  "🗂️", "🚀", "📒", "📐", "🔭", "🗒️", "💼", "🌱",
  "📚", "🗓️", "🔬", "✏️",
];

export const CALLOUT_ICONS = ["💡", "⚠️", "✅", "📌", "🧪", "🔥", "🎯", "📘"];

export const STORAGE_KEY = "pratamalab:v1";
