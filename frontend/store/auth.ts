import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Workspace } from "@/types";
import api from "@/lib/api";

interface AuthState {
  user:       User | null;
  token:      string | null;
  workspace:  Workspace | null;
  isLoading:  boolean;

  setAuth:        (user: User, token: string, workspace?: Workspace) => void;
  setWorkspace:   (workspace: Workspace) => void;
  logout:         () => Promise<void>;
  fetchMe:        () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:      null,
      token:     null,
      workspace: null,
      isLoading: false,

      setAuth(user, token, workspace) {
        localStorage.setItem("pratamalab_token", token);
        set({ user, token, workspace: workspace ?? get().workspace });
      },

      setWorkspace(workspace) {
        set({ workspace });
      },

      async logout() {
        try {
          await api.post("/auth/logout");
        } catch { /* ignore */ }
        localStorage.removeItem("pratamalab_token");
        set({ user: null, token: null, workspace: null });
      },

      async fetchMe() {
        set({ isLoading: true });
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "pratamalab-auth",
      partialize: (state) => ({
        user:      state.user,
        token:     state.token,
        workspace: state.workspace,
      }),
    }
  )
);
