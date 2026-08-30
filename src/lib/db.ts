/**
 * Database abstraction layer.
 * Falls back to localStorage automatically when Supabase is not configured.
 */
import { supabase, isOfflineMode } from "./supabase";
import type { Page, Block, Profile, Workspace, WorkspaceMember, Comment } from "../types";
import { uid } from "./util";

const STORAGE_KEY   = "pratamalab:v2";
const WORKSPACE_KEY = "pratamalab:workspace";

// ─── Local storage helpers ───────────────────────────────────

function loadLocal(): { pages: Page[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as { pages?: Page[]; activeId?: string };
      if (Array.isArray(d.pages))
        return { pages: d.pages, activeId: d.activeId ?? d.pages[0]?.id ?? null };
    }
  } catch { /* corrupt data */ }
  return { pages: [], activeId: null };
}

function saveLocal(pages: Page[], activeId: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages, activeId }));
  } catch {
    throw new Error("Penyimpanan browser penuh atau tidak tersedia");
  }
}

// ─── Profile ────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  if (isOfflineMode()) {
    return {
      id: userId,
      email: "user@offline.local",
      display_name: "You",
      avatar_color: "#6366f1",
    };
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
  if (isOfflineMode()) return;
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

// ─── Workspace ───────────────────────────────────────────────

export async function getOrCreateWorkspace(userId: string): Promise<Workspace> {
  if (isOfflineMode()) {
    const stored = localStorage.getItem(WORKSPACE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as Workspace;
      } catch {
        localStorage.removeItem(WORKSPACE_KEY);
      }
    }
    const ws: Workspace = {
      id: uid(),
      name: "My Workspace",
      icon: "🏠",
      owner_id: userId,
      plan: "free",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(ws));
    return ws;
  }

  // Check if user already has a workspace
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(*)")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (memberships?.workspaces) {
    return memberships.workspaces as unknown as Workspace;
  }

  // Create a new workspace + add user as owner
  const { data: ws, error } = await supabase
    .from("workspaces")
    .insert({ name: "My Workspace", icon: "🏠", owner_id: userId })
    .select()
    .single();
  if (error) throw error;

  return ws as Workspace;
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  if (isOfflineMode()) return [];
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*, profile:profiles(*)")
    .eq("workspace_id", workspaceId);
  if (error) return [];
  return data as WorkspaceMember[];
}

// ─── Pages ──────────────────────────────────────────────────

export async function fetchPages(workspaceId: string): Promise<Page[]> {
  if (isOfflineMode()) {
    const { pages } = loadLocal();
    return pages;
  }
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  // blocks are loaded per-page lazily
  return (data as Page[]).map((p) => ({ ...p, blocks: [] }));
}

export async function fetchPageBlocks(pageId: string): Promise<Block[]> {
  if (isOfflineMode()) {
    const { pages } = loadLocal();
    return pages.find((p) => p.id === pageId)?.blocks ?? [];
  }
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as Block[]).map((b) => ({ ...b, v: 0 }));
}

export async function createPage(
  workspaceId: string,
  userId: string,
  partial: Partial<Page> = {}
): Promise<Page> {
  const now = new Date().toISOString();

  if (isOfflineMode()) {
    const { pages } = loadLocal();
    const newPage: Page = {
      id: uid(),
      workspace_id: workspaceId,
      parent_id: partial.parent_id ?? null,
      title: partial.title ?? "",
      icon: partial.icon ?? "📄",
      cover_url: null,
      is_public: false,
      is_deleted: false,
      created_by: userId,
      updated_by: userId,
      sort_order: pages.length,
      blocks: [{ id: uid(), page_id: "", type: "text", html: "", sort_order: 0, v: 0 }],
      created_at: now,
      updated_at: now,
    };
    newPage.blocks[0].page_id = newPage.id;
    saveLocal([newPage, ...pages], newPage.id);
    return newPage;
  }

  const { data: page, error } = await supabase
    .from("pages")
    .insert({
      workspace_id: workspaceId,
      parent_id: partial.parent_id ?? null,
      title: partial.title ?? "",
      icon: partial.icon ?? "📄",
      created_by: userId,
      updated_by: userId,
      sort_order: Date.now(),
    })
    .select()
    .single();
  if (error) throw error;

  // Insert default empty text block
  const { data: block } = await supabase
    .from("blocks")
    .insert({ page_id: page.id, type: "text", html: "", sort_order: 0 })
    .select()
    .single();

  return { ...(page as Page), blocks: block ? [{ ...(block as Block), v: 0 }] : [] };
}

export async function updatePage(
  pageId: string,
  updates: Partial<Pick<Page, "title" | "icon" | "cover_url" | "is_public" | "parent_id">>,
  userId: string
): Promise<void> {
  if (isOfflineMode()) {
    const { pages, activeId } = loadLocal();
    const updated = pages.map((p) =>
      p.id === pageId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    saveLocal(updated, activeId);
    return;
  }
  const { error } = await supabase
    .from("pages")
    .update({ ...updates, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("id", pageId);
  if (error) throw error;
}

export async function softDeletePage(pageId: string): Promise<void> {
  if (isOfflineMode()) {
    const { pages, activeId } = loadLocal();
    saveLocal(pages.filter((p) => p.id !== pageId), activeId);
    return;
  }
  const { error } = await supabase.from("pages").update({ is_deleted: true }).eq("id", pageId);
  if (error) throw error;
}

export async function reorderPages(pageIds: string[]): Promise<void> {
  if (isOfflineMode()) return;
  const updates = pageIds.map((id, i) => ({ id, sort_order: i * 1000 }));
  const { error } = await supabase.from("pages").upsert(updates);
  if (error) throw error;
}

// ─── Blocks ─────────────────────────────────────────────────

export async function upsertBlock(block: Block): Promise<void> {
  if (isOfflineMode()) {
    const { pages, activeId } = loadLocal();
    const updated = pages.map((p) => {
      if (p.id !== block.page_id) return p;
      const exists = p.blocks.some((b) => b.id === block.id);
      return {
        ...p,
        blocks: exists
          ? p.blocks.map((b) => (b.id === block.id ? block : b))
          : [...p.blocks, block],
        updated_at: new Date().toISOString(),
      };
    });
    saveLocal(updated, activeId);
    return;
  }
  const { id, v: _v, ...rest } = block;
  const { error } = await supabase.from("blocks").upsert({ id, ...rest });
  if (error) throw error;
}

export async function upsertBlocks(blocks: Block[]): Promise<void> {
  if (isOfflineMode()) {
    if (!blocks.length) return;
    const pageId = blocks[0].page_id;
    const { pages, activeId } = loadLocal();
    const updated = pages.map((p) => {
      if (p.id !== pageId) return p;
      const blockMap = new Map(p.blocks.map((b) => [b.id, b]));
      for (const b of blocks) blockMap.set(b.id, b);
      return {
        ...p,
        blocks: Array.from(blockMap.values()).sort((a, b) => a.sort_order - b.sort_order),
        updated_at: new Date().toISOString(),
      };
    });
    saveLocal(updated, activeId);
    return;
  }
  const rows = blocks.map(({ v: _v, ...rest }) => rest);
  const { error } = await supabase.from("blocks").upsert(rows);
  if (error) throw error;
}

export async function deleteBlock(blockId: string): Promise<void> {
  if (isOfflineMode()) {
    const { pages, activeId } = loadLocal();
    const updated = pages.map((p) => ({
      ...p,
      blocks: p.blocks.filter((b) => b.id !== blockId),
    }));
    saveLocal(updated, activeId);
    return;
  }
  const { error } = await supabase.from("blocks").delete().eq("id", blockId);
  if (error) throw error;
}

export async function reorderBlocks(
  pageId: string,
  blockIds: string[]
): Promise<void> {
  if (isOfflineMode()) {
    const { pages, activeId } = loadLocal();
    const updated = pages.map((p) => {
      if (p.id !== pageId) return p;
      const blockMap = new Map(p.blocks.map((b) => [b.id, b]));
      const reordered = blockIds
        .map((id, i) => {
          const b = blockMap.get(id);
          return b ? { ...b, sort_order: i * 1000 } : null;
        })
        .filter(Boolean) as Block[];
      return { ...p, blocks: reordered };
    });
    saveLocal(updated, activeId);
    return;
  }
  const updates = blockIds.map((id, i) => ({ id, page_id: pageId, sort_order: i * 1000 }));
  const { error } = await supabase.from("blocks").upsert(updates);
  if (error) throw error;
}

// ─── Comments ────────────────────────────────────────────────

export async function fetchComments(pageId: string): Promise<Comment[]> {
  if (isOfflineMode()) return [];
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:profiles(id,display_name,avatar_url,avatar_color)")
    .eq("page_id", pageId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data as Comment[];
}

export async function addComment(
  pageId: string,
  content: string,
  authorId: string,
  blockId?: string
): Promise<Comment | null> {
  if (isOfflineMode()) return null;
  const { data, error } = await supabase
    .from("comments")
    .insert({ page_id: pageId, content, author_id: authorId, block_id: blockId ?? null })
    .select("*, author:profiles(*)")
    .single();
  if (error) return null;
  return data as Comment;
}

// ─── Search ─────────────────────────────────────────────────

export async function searchPages(
  workspaceId: string,
  query: string
): Promise<Page[]> {
  if (isOfflineMode()) {
    const { pages } = loadLocal();
    const q = query.toLowerCase();
    return pages.filter(
      (p) => p.title.toLowerCase().includes(q) || p.icon.includes(q)
    );
  }
  const { data } = await supabase
    .from("pages")
    .select("id, title, icon, updated_at")
    .eq("workspace_id", workspaceId)
    .eq("is_deleted", false)
    .textSearch("title", query, { type: "websearch" })
    .limit(20);
  return ((data ?? []) as Page[]).map((p) => ({ ...p, blocks: [] }));
}

// ─── Local save helpers (offline debounce) ──────────────────

export { saveLocal, loadLocal };
