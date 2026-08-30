export const uid = (): string => crypto.randomUUID();

export const STORAGE_KEY = "pratamalab:v2";

export const PAGE_ICONS = [
  "📄","📝","📋","📁","📂","🗂️","📊","📈","📉","📌",
  "📍","🗒️","🗓️","📅","💡","🔍","🎯","🚀","⭐","🏠",
  "💼","🎨","🎬","📚","🔧","🌟","💎","🔑","🎵","🌈",
];

export const CALLOUT_ICONS = [
  "💡","⚠️","🔥","✅","❌","📌","🎯","🚀","💎","⭐","🔔","🛡️",
];

export const AVATAR_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#ef4444","#f97316",
  "#eab308","#22c55e","#14b8a6","#3b82f6","#06b6d4",
];

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function stripHtml(html: string): string {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent ?? "";
  } catch {
    return html.replace(/<[^>]*>/g, "");
  }
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function timeAgo(ms: number | string): string {
  const date = typeof ms === "string" ? new Date(ms).getTime() : ms;
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 5)   return "baru saja";
  if (diff < 60)  return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sanitizeHtml(html: string): string {
  // Allow only safe inline tags
  const ALLOWED = /^(b|strong|i|em|u|s|code|span|a|br)$/i;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const clean = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent ?? "");
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED.test(tag)) {
        return Array.from(el.childNodes).map(clean).join("");
      }
      const attrs: string[] = [];
      if (tag === "a") {
        const href = el.getAttribute("href") ?? "";
        if (isSafeHttpUrl(href)) attrs.push(`href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"`);
      }
      const inner = Array.from(el.childNodes).map(clean).join("");
      return `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}>${inner}</${tag}>`;
    };
    return Array.from(doc.body.childNodes).map(clean).join("");
  } catch {
    return escapeHtml(html);
  }
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
