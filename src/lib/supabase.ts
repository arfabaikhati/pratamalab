import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { PresenceUser, CollabChange } from "../types";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";

function hasValidSupabaseConfig(): boolean {
  if (!supabaseUrl || !supabaseKey) return false;
  if (/your-project|placeholder|example/i.test(supabaseUrl)) return false;
  if (/your-anon|placeholder|example/i.test(supabaseKey)) return false;

  try {
    const url = new URL(supabaseUrl);
    const validHost =
      url.protocol === "https:" &&
      (url.hostname.endsWith(".supabase.co") ||
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1");
    const validKey =
      (supabaseKey.startsWith("eyJ") || supabaseKey.startsWith("sb_publishable_")) &&
      supabaseKey.length >= 32;
    return validHost && validKey;
  } catch {
    return false;
  }
}

const supabaseConfigured = hasValidSupabaseConfig();

if (!supabaseConfigured) {
  console.info(
    "[Pratamalab] Supabase env vars not set — running in offline/localStorage mode."
  );
}

export const supabase = createClient(
  supabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  supabaseConfigured ? supabaseKey : "placeholder",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
    global: {
      headers: { "x-app-name": "pratamalab" },
    },
  }
);

// ─── Auth helpers ───────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset`,
  });
  if (error) throw error;
}

// ─── Realtime presence ──────────────────────────────────────

let presenceChannel: RealtimeChannel | null = null;

export function joinPresence(
  pageId: string,
  user: Omit<PresenceUser, "page_id" | "last_seen">,
  onSync: (users: PresenceUser[]) => void
): () => void {
  // Leave any existing channel
  if (presenceChannel) {
    supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }

  const channel = supabase.channel(`presence:${pageId}`, {
    config: { presence: { key: user.user_id } },
  });

  presenceChannel = channel;

  const getUsers = () => {
    const state = channel.presenceState<PresenceUser>();
    const users: PresenceUser[] = [];
    for (const presences of Object.values(state)) {
      for (const p of presences as PresenceUser[]) {
        users.push(p);
      }
    }
    return users;
  };

  channel
    .on("presence", { event: "sync" }, () => onSync(getUsers()))
    .on("presence", { event: "join" }, () => onSync(getUsers()))
    .on("presence", { event: "leave" }, () => onSync(getUsers()))
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ ...user, page_id: pageId, last_seen: Date.now() });
      }
    });

  return () => {
    supabase.removeChannel(channel);
    presenceChannel = null;
  };
}

export function updatePresenceCursor(
  blockId: string,
  offset: number
) {
  if (!presenceChannel) return;
  presenceChannel.track({ cursor: { block_id: blockId, offset } });
}

// ─── Realtime block changes ──────────────────────────────────

export function subscribeToPageChanges(
  pageId: string,
  onInsert: (block: Record<string, unknown>) => void,
  onUpdate: (block: Record<string, unknown>) => void,
  onDelete: (blockId: string) => void
): () => void {
  const channel = supabase
    .channel(`blocks:${pageId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "blocks", filter: `page_id=eq.${pageId}` },
      (payload) => onInsert(payload.new as Record<string, unknown>)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "blocks", filter: `page_id=eq.${pageId}` },
      (payload) => onUpdate(payload.new as Record<string, unknown>)
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "blocks", filter: `page_id=eq.${pageId}` },
      (payload) => onDelete((payload.old as { id: string }).id)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function broadcastChange(pageId: string, change: CollabChange) {
  supabase.channel(`collab:${pageId}`).send({
    type: "broadcast",
    event: "change",
    payload: change,
  });
}

// ─── Offline detection ───────────────────────────────────────

export function isOfflineMode(): boolean {
  return !supabaseConfigured;
}
