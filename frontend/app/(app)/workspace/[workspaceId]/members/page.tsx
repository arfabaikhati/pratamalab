"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { cn, avatarColor, getInitials, formatDate } from "@/lib/utils";
import type { WorkspaceMember } from "@/types";
import toast from "react-hot-toast";
import { UserPlus, Shield, Eye, Edit2, Crown, Trash2 } from "lucide-react";

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner:  <Crown size={12} className="text-amber-500" />,
  admin:  <Shield size={12} className="text-blue-500" />,
  editor: <Edit2 size={12} className="text-green-500" />,
  viewer: <Eye size={12} className="text-gray-500" />,
};

export default function MembersPage() {
  const params      = useParams();
  const workspaceId = parseInt(params.workspaceId as string);
  const currentUser = useAuthStore((s) => s.user);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState<"editor" | "viewer">("editor");
  const [inviting, setInviting]       = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/workspaces/${workspaceId}/members`);
        setMembers(data);
      } catch {
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workspaceId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post(`/workspaces/${workspaceId}/members/invite`, {
        email: inviteEmail,
        role:  inviteRole,
      });
      toast.success("Member invited!");
      setInviteEmail("");
      // Refresh
      const { data } = await api.get(`/workspaces/${workspaceId}/members`);
      setMembers(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to invite";
      toast.error(msg);
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(userId: number) {
    if (!confirm("Remove this member?")) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-8">Members</h1>

        {/* Invite form */}
        <form onSubmit={handleInvite} className="flex gap-2 mb-8">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Invite by email…"
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm focus:outline-none"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition disabled:opacity-60"
          >
            <UserPlus size={14} />
            {inviting ? "Inviting…" : "Invite"}
          </button>
        </form>

        {/* Member list */}
        {loading ? (
          <div className="text-secondary text-sm">Loading…</div>
        ) : (
          <div className="space-y-1">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition"
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0",
                  avatarColor(member.id)
                )}>
                  {member.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(member.name)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.name}
                    {member.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-secondary">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-secondary truncate">{member.email}</p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-secondary px-2 py-1 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]">
                  {ROLE_ICONS[member.pivot?.role ?? "viewer"]}
                  <span className="capitalize">{member.pivot?.role ?? "viewer"}</span>
                </div>

                {member.pivot?.joined_at && (
                  <span className="text-xs text-muted hidden sm:block">
                    Joined {formatDate(member.pivot.joined_at)}
                  </span>
                )}

                {member.pivot?.role !== "owner" && member.id !== currentUser?.id && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-secondary hover:text-red-500 transition"
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
