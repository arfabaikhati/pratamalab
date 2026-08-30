import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import AuthPage from "./components/AuthPage";
import App from "./App";

/** Reads & persists dark mode preference */
function useTheme(): ["light" | "dark", () => void] {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("pratamalab:theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("pratamalab:theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return [theme, toggle];
}

export default function Root() {
  const auth = useAuth();
  const [theme, toggleTheme] = useTheme();

  if (auth.loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
          background: "var(--bg)",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Animated logo */}
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "spin-slow 2s linear infinite" }}
        >
          <path d="M10 3h4M11 3v5.2L5.8 17.5A2.4 2.4 0 0 0 8 21h8a2.4 2.4 0 0 0 2.2-3.5L13 8.2V3" />
          <path d="M7.6 14.5h8.8" />
        </svg>
        <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Memuat…</span>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div style={{ minHeight: "100dvh", width: "100%", display: "grid", placeItems: "center", padding: 24, background: "var(--bg)" }}>
        <div style={{ width: "min(440px, 100%)", padding: 24, border: "1px solid var(--border)", borderRadius: 16, background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>Workspace belum dapat dimuat</h1>
          <p style={{ margin: "0 0 18px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{auth.error}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Coba lagi</button>
            {auth.user && <button className="btn btn-ghost" onClick={auth.signOut}>Keluar</button>}
          </div>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in and not in offline mode
  if (!auth.user || !auth.profile || !auth.workspace) {
    return <AuthPage />;
  }

  return (
    <App
      profile={auth.profile!}
      workspace={auth.workspace!}
      theme={theme}
      toggleTheme={toggleTheme}
      onSignOut={auth.signOut}
    />
  );
}
