import { useEffect, useState } from "react";
import { joinPresence } from "../lib/supabase";
import { isOfflineMode } from "../lib/supabase";
import type { PresenceUser, Profile } from "../types";
import { getInitials } from "../lib/util";

interface Props {
  pageId: string;
  profile: Profile;
}

export default function CollabCursors({ pageId, profile }: Props) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (isOfflineMode()) return;

    const leave = joinPresence(
      pageId,
      {
        user_id: profile.id,
        display_name: profile.display_name,
        avatar_color: profile.avatar_color,
        avatar_url: profile.avatar_url,
      },
      (all) => {
        // Exclude self
        setUsers(all.filter((u) => u.user_id !== profile.id));
      }
    );

    return leave;
  }, [pageId, profile.id, profile.display_name, profile.avatar_color, profile.avatar_url]);

  if (users.length === 0) return null;

  const visible = users.slice(0, 5);
  const extra   = users.length - visible.length;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
      title={`${users.length} pengguna aktif: ${users.map((u) => u.display_name).join(", ")}`}
    >
      <div style={{ display: "flex" }}>
        {visible.map((u, i) => (
          <div
            key={u.user_id}
            className="presence-avatar tooltip-parent"
            style={{
              background: u.avatar_color,
              marginLeft: i > 0 ? -8 : 0,
              zIndex: visible.length - i,
            }}
            title={u.display_name}
          >
            {u.avatar_url ? (
              <img
                src={u.avatar_url}
                alt={u.display_name}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              getInitials(u.display_name)
            )}
            <span className="tooltip">{u.display_name}</span>
          </div>
        ))}
        {extra > 0 && (
          <div
            className="presence-avatar"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              fontSize: 10,
              fontWeight: 700,
              marginLeft: -8,
            }}
          >
            +{extra}
          </div>
        )}
      </div>
      <span
        style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#22c55e",
          boxShadow: "0 0 6px rgba(34,197,94,0.6)",
          display: "inline-block",
          animation: "pulse-soft 2s ease-in-out infinite",
          marginLeft: 4,
        }}
      />
    </div>
  );
}
