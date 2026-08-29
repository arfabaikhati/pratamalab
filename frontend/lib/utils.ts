import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const PAGE_TYPE_ICONS: Record<string, string> = {
  document:     "📄",
  database:     "🗄️",
  spreadsheet:  "📊",
  presentation: "📽️",
  whiteboard:   "🖼️",
};

export const AVATAR_COLORS = [
  "bg-rose-500", "bg-orange-500", "bg-amber-500",
  "bg-emerald-500", "bg-sky-500", "bg-violet-500",
  "bg-pink-500", "bg-indigo-500",
];

export function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}
