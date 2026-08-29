// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  timezone: string;
  preferences: Record<string, unknown> | null;
  last_seen_at: string | null;
  created_at: string;
}

// ── Workspace ─────────────────────────────────────────────────────────────────
export interface Workspace {
  id: number;
  uuid: string;
  owner_id: number;
  name: string;
  slug: string;
  icon: string | null;
  cover: string | null;
  description: string | null;
  plan: "free" | "pro" | "team";
  settings: Record<string, unknown> | null;
  pages_count?: number;
  owner?: Pick<User, "id" | "name" | "avatar" | "email">;
  members?: WorkspaceMember[];
  pivot?: { role: WorkspaceRole; joined_at: string };
  created_at: string;
  updated_at: string;
}

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface WorkspaceMember extends User {
  pivot: { role: WorkspaceRole; joined_at: string };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export type PageType = "document" | "database" | "spreadsheet" | "presentation" | "whiteboard";
export type PageAccess = "private" | "workspace" | "public";

export interface Page {
  id: number;
  uuid: string;
  workspace_id: number;
  created_by: number;
  last_edited_by: number | null;
  parent_id: number | null;
  title: string;
  icon: string | null;
  cover: string | null;
  type: PageType;
  is_template: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  is_locked: boolean;
  access: PageAccess;
  position: number;
  metadata: Record<string, unknown> | null;
  last_viewed_at: string | null;
  children?: Page[];
  creator?: Pick<User, "id" | "name" | "avatar">;
  last_editor?: Pick<User, "id" | "name" | "avatar">;
  collaborators?: Pick<User, "id" | "name" | "avatar">[];
  created_at: string;
  updated_at: string;
}

// ── Block ─────────────────────────────────────────────────────────────────────
export type BlockType =
  | "paragraph"
  | "heading_1" | "heading_2" | "heading_3"
  | "bulleted_list" | "numbered_list" | "todo" | "toggle"
  | "code" | "quote" | "callout" | "divider"
  | "image" | "video" | "file" | "audio" | "embed"
  | "table" | "table_row"
  | "equation"
  | "column_list" | "column";

export interface Block {
  id: number;
  uuid: string;
  page_id: number;
  created_by: number;
  parent_block_id: number | null;
  type: BlockType;
  content: unknown[] | null;
  props: Record<string, unknown> | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// ── API Responses ─────────────────────────────────────────────────────────────
export interface AuthResponse {
  user: User;
  workspace?: Workspace;
  access_token: string;
  token_type: "Bearer";
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ── Presence ──────────────────────────────────────────────────────────────────
export interface OnlineUser {
  id: number;
  name: string;
  avatar: string | null;
}
