"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useWorkspaceStore } from "@/store/workspace";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params      = useParams();
  const workspaceId = parseInt(params.workspaceId as string);

  const setWorkspace  = useAuthStore((s) => s.setWorkspace);
  const fetchPages    = useWorkspaceStore((s) => s.fetchPages);
  const sidebarOpen   = useWorkspaceStore((s) => s.sidebarOpen);

  useEffect(() => {
    async function init() {
      try {
        const { data } = await api.get(`/workspaces/${workspaceId}`);
        setWorkspace(data);
        await fetchPages(workspaceId);
      } catch { /* handled by interceptor */ }
    }
    init();
  }, [workspaceId, setWorkspace, fetchPages]);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && <Sidebar workspaceId={workspaceId} />}
      <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
    </div>
  );
}
