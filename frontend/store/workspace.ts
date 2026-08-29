import { create } from "zustand";
import type { Page, Workspace } from "@/types";
import api from "@/lib/api";

interface WorkspaceState {
  workspaces:       Workspace[];
  activeWorkspace:  Workspace | null;
  pages:            Page[];
  activePage:       Page | null;
  sidebarOpen:      boolean;
  isLoadingPages:   boolean;

  setWorkspaces:      (ws: Workspace[]) => void;
  setActiveWorkspace: (ws: Workspace) => void;
  setPages:           (pages: Page[]) => void;
  setActivePage:      (page: Page | null) => void;
  toggleSidebar:      () => void;
  fetchPages:         (workspaceId: number) => Promise<void>;
  addPage:            (page: Page) => void;
  updatePage:         (id: number, updates: Partial<Page>) => void;
  removePage:         (id: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  workspaces:      [],
  activeWorkspace: null,
  pages:           [],
  activePage:      null,
  sidebarOpen:     true,
  isLoadingPages:  false,

  setWorkspaces(ws) {
    set({ workspaces: ws });
  },

  setActiveWorkspace(ws) {
    set({ activeWorkspace: ws });
  },

  setPages(pages) {
    set({ pages });
  },

  setActivePage(page) {
    set({ activePage: page });
  },

  toggleSidebar() {
    set((s) => ({ sidebarOpen: !s.sidebarOpen }));
  },

  async fetchPages(workspaceId) {
    set({ isLoadingPages: true });
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/pages`);
      set({ pages: data });
    } finally {
      set({ isLoadingPages: false });
    }
  },

  addPage(page) {
    set((s) => ({ pages: [...s.pages, page] }));
  },

  updatePage(id, updates) {
    set((s) => ({
      pages: s.pages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      activePage: s.activePage?.id === id ? { ...s.activePage, ...updates } : s.activePage,
    }));
  },

  removePage(id) {
    set((s) => ({
      pages: s.pages.filter((p) => p.id !== id),
      activePage: s.activePage?.id === id ? null : s.activePage,
    }));
  },
}));
