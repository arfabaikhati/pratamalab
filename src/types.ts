// ============================================================
// Core block & page types
// ============================================================

export type BlockType =
  | "text" | "h1" | "h2" | "h3"
  | "todo" | "bullet" | "numbered"
  | "quote" | "callout" | "code"
  | "formula" | "table" | "divider"
  | "image" | "embed" | "toggle";

export interface Block {
  id: string;
  page_id: string;
  type: BlockType;
  html: string;
  sort_order: number;
  v: number;            // local version for Editable remount
  checked?: boolean;
  icon?: string;
  lang?: string;
  rows?: string[][];
  props?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Page {
  id: string;
  workspace_id: string;
  parent_id?: string | null;
  title: string;
  icon: string;
  cover_url?: string | null;
  is_public: boolean;
  is_deleted: boolean;
  created_by: string;
  updated_by?: string | null;
  sort_order: number;
  blocks: Block[];
  created_at: string;
  updated_at: string;
}

// ============================================================
// User & auth types
// ============================================================

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  avatar_color: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  owner_id: string;
  plan: "free" | "pro" | "team";
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  profile?: Profile;
}

// ============================================================
// Live collaboration types
// ============================================================

export interface PresenceUser {
  user_id: string;
  display_name: string;
  avatar_color: string;
  avatar_url?: string | null;
  page_id: string;
  cursor?: { block_id: string; offset: number } | null;
  last_seen: number;
}

export interface CollabChange {
  type: "block_update" | "block_insert" | "block_delete" | "page_update";
  page_id: string;
  block?: Partial<Block>;
  block_id?: string;
  user_id: string;
  timestamp: number;
}

// ============================================================
// UI state types
// ============================================================

export interface SlashDef {
  type: BlockType;
  label: string;
  desc: string;
  kw: string;
  icon?: string;
  group?: string;
}

export interface FocusReq {
  id: string;
  pos: number;
  tick: number;
}

export interface Toast {
  id: number;
  msg: string;
  type?: "info" | "success" | "error" | "warning";
}

export interface Comment {
  id: string;
  page_id: string;
  block_id?: string | null;
  author_id: string;
  content: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

// ============================================================
// App-wide context types
// ============================================================

export interface AppContextValue {
  profile: Profile | null;
  workspace: Workspace | null;
  pages: Page[];
  activePageId: string | null;
  setActivePageId: (id: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  toast: (msg: string, type?: Toast["type"]) => void;
}
