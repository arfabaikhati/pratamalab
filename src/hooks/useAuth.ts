import { useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isOfflineMode, signOut as supabaseSignOut } from "../lib/supabase";
import { getProfile, getOrCreateWorkspace } from "../lib/db";
import type { Profile, Workspace } from "../types";
import { uid, AVATAR_COLORS, randomFrom } from "../lib/util";

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  workspace: Workspace | null;
  loading: boolean;
  error: string | null;
}

const OFFLINE_USER_KEY = "pratamalab:offline_user";

function getOfflineUser(): { user: User; profile: Profile } {
  try {
    const stored = localStorage.getItem(OFFLINE_USER_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }

  const id = uid();
  const profile: Profile = {
    id,
    email: "user@offline.local",
    display_name: "Saya",
    avatar_color: randomFrom(AVATAR_COLORS),
  };
  const user = { id, email: profile.email } as User;
  localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify({ user, profile }));
  return { user, profile };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    workspace: null,
    loading: true,
    error: null,
  });

  const loadWorkspace = useCallback(async (userId: string, profile: Profile) => {
    try {
      const workspace = await getOrCreateWorkspace(userId);
      setState((s) => ({ ...s, profile, workspace, loading: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        profile,
        workspace: null,
        loading: false,
        error: err instanceof Error ? err.message : "Gagal memuat workspace",
      }));
    }
  }, []);

  useEffect(() => {
    // Offline mode: skip Supabase auth entirely
    if (isOfflineMode()) {
      const { user, profile } = getOfflineUser();
      loadWorkspace(user.id, profile);
      setState((s) => ({ ...s, user, session: null }));
      return;
    }

    // Online mode: check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        if (profile) {
          setState((s) => ({ ...s, user: session.user, session }));
          loadWorkspace(session.user.id, profile);
        } else {
          setState((s) => ({
            ...s,
            user: session.user,
            session,
            loading: false,
            error: "Profil akun belum tersedia. Pastikan migrasi database sudah dijalankan.",
          }));
        }
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    }).catch((err) => {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Gagal memeriksa sesi",
      }));
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const profile = await getProfile(session.user.id);
          if (profile) {
            setState((s) => ({ ...s, user: session.user, session }));
            loadWorkspace(session.user.id, profile);
          } else {
            setState((s) => ({
              ...s,
              user: session.user,
              session,
              loading: false,
              error: "Profil akun belum tersedia. Pastikan migrasi database sudah dijalankan.",
            }));
          }
        }
        if (event === "SIGNED_OUT") {
          setState({
            user: null, session: null, profile: null,
            workspace: null, loading: false, error: null,
          });
        }
        if (event === "TOKEN_REFRESHED" && session) {
          setState((s) => ({ ...s, session }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadWorkspace]);

  const signOut = useCallback(async () => {
    if (isOfflineMode()) return;
    try {
      await supabaseSignOut();
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Gagal keluar",
      }));
    }
  }, []);

  return { ...state, signOut };
}
