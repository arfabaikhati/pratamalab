"use client";

import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspace";
import { useAuthStore } from "@/store/auth";
import { formatDate, PAGE_TYPE_ICONS } from "@/lib/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, FileText, Clock } from "lucide-react";

export default function WorkspaceHomePage() {
  const params      = useParams();
  const router      = useRouter();
  const workspaceId = parseInt(params.workspaceId as string);
  const workspace   = useAuthStore((s) => s.workspace);
  const pages       = useWorkspaceStore((s) => s.pages);
  const addPage     = useWorkspaceStore((s) => s.addPage);

  const recentPages = [...pages]
    .filter((p) => !p.is_archived)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 12);

  async function createPage() {
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/pages`, {
        title: "Untitled",
        type: "document",
      });
      addPage(data);
      router.push(`/workspace/${workspaceId}/page/${data.id}`);
    } catch {
      toast.error("Failed to create page");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-8 pt-16 pb-8">
        <div className="text-4xl mb-2">{workspace?.icon ?? "🏠"}</div>
        <h1 className="text-3xl font-bold">{workspace?.name ?? "Workspace"}</h1>
        {workspace?.description && (
          <p className="text-secondary mt-2">{workspace.description}</p>
        )}

        <button
          onClick={createPage}
          className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition"
        >
          <Plus size={16} /> New page
        </button>
      </div>

      {/* Recent pages */}
      {recentPages.length > 0 && (
        <div className="max-w-3xl mx-auto px-8 pb-16">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wide mb-4">
            <Clock size={12} /> Recently updated
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentPages.map((page) => (
              <button
                key={page.id}
                onClick={() => router.push(`/workspace/${workspaceId}/page/${page.id}`)}
                className="text-left p-4 rounded-xl border border-[var(--border)] hover:border-brand-300 hover:bg-[var(--bg-secondary)] transition group"
              >
                <div className="text-xl mb-2">
                  {page.icon ?? PAGE_TYPE_ICONS[page.type] ?? "📄"}
                </div>
                <p className="text-sm font-medium truncate group-hover:text-brand-600 transition">
                  {page.title || "Untitled"}
                </p>
                <p className="text-xs text-secondary mt-1">
                  {formatDate(page.updated_at)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pages.length === 0 && (
        <div className="max-w-3xl mx-auto px-8 pb-16 text-center py-20">
          <FileText size={40} className="mx-auto text-muted mb-4" />
          <h3 className="text-lg font-medium mb-2">No pages yet</h3>
          <p className="text-secondary text-sm mb-6">Create your first page to get started.</p>
          <button
            onClick={createPage}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition"
          >
            Create first page
          </button>
        </div>
      )}
    </div>
  );
}
