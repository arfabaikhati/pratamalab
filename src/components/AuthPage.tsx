import { useState } from "react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, isOfflineMode } from "../lib/supabase";

type Mode = "login" | "signup" | "reset";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email) { setError("Email wajib diisi."); return; }

    setLoading(true);
    try {
      if (mode === "login") {
        if (!password) { setError("Password wajib diisi."); setLoading(false); return; }
        await signInWithEmail(email, password);
      } else if (mode === "signup") {
        if (!name.trim()) { setError("Nama wajib diisi."); setLoading(false); return; }
        if (password.length < 8) { setError("Password minimal 8 karakter."); setLoading(false); return; }
        await signUpWithEmail(email, password, name.trim());
        setSuccess("Cek email Anda untuk konfirmasi akun.");
      } else {
        await resetPassword(email);
        setSuccess("Link reset password sudah dikirim ke email Anda.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        background: "var(--bg)",
        padding: "24px 16px",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden",
          zIndex: 0,
        }}
      >
        <div style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-20%", left: "-10%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        {/* Logo + Brand */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            marginBottom: 16,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3h4M11 3v5.2L5.8 17.5A2.4 2.4 0 0 0 8 21h8a2.4 2.4 0 0 0 2.2-3.5L13 8.2V3" />
              <path d="M7.6 14.5h8.8" />
            </svg>
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800,
            color: "var(--text-primary)", margin: "0 0 6px",
          }}>
            Pratamalab
          </h1>
          <p style={{ color: "var(--text-tertiary)", fontSize: 14, margin: 0 }}>
            Ruang kerja fleksibel untuk tim modern
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px 28px" }}>
          {/* Tab switcher */}
          {mode !== "reset" && (
            <div style={{
              display: "flex", background: "var(--bg-tertiary)",
              borderRadius: "var(--radius-md)", padding: 3, marginBottom: 24,
            }}>
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  style={{
                    flex: 1, padding: "8px 12px", border: "none", cursor: "pointer",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600,
                    transition: "all 0.18s",
                    background: mode === m ? "var(--surface)" : "transparent",
                    color: mode === m ? "var(--text-primary)" : "var(--text-tertiary)",
                    boxShadow: mode === m ? "var(--shadow-xs)" : "none",
                  }}
                >
                  {m === "login" ? "Masuk" : "Daftar"}
                </button>
              ))}
            </div>
          )}

          {mode === "reset" && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{
                fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700,
                color: "var(--text-primary)", margin: "0 0 6px",
              }}>Reset Password</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 13.5, margin: 0 }}>
                Masukkan email Anda untuk menerima link reset.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
                  Nama Lengkap
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="kamu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 12, color: "var(--accent)", fontWeight: 500, padding: 0,
                      }}
                    >
                      Lupa password?
                    </button>
                  )}
                </div>
                <input
                  className="input"
                  type="password"
                  placeholder={mode === "signup" ? "Minimal 8 karakter" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            )}

            {error && (
              <div style={{
                background: "var(--danger-soft)", color: "var(--danger)",
                padding: "9px 13px", borderRadius: "var(--radius-md)",
                fontSize: 13, fontWeight: 500, display: "flex", gap: 8, alignItems: "center",
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {success && (
              <div style={{
                background: "var(--success-soft)", color: "#065f46",
                padding: "9px 13px", borderRadius: "var(--radius-md)",
                fontSize: 13, fontWeight: 500, display: "flex", gap: 8, alignItems: "center",
              }}>
                <span>✅</span> {success}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", marginTop: 4, height: 42, fontSize: 14.5 }}
            >
              {loading ? (
                <svg className="animate-spin-slow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : mode === "login" ? "Masuk" : mode === "signup" ? "Buat Akun" : "Kirim Link Reset"}
            </button>
          </form>

          {mode !== "reset" && !isOfflineMode() && (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, margin: "18px 0",
              }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 500 }}>atau</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              <button
                onClick={signInWithGoogle}
                className="btn btn-secondary"
                style={{ width: "100%", height: 42, gap: 10 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Lanjutkan dengan Google
              </button>
            </>
          )}

          {mode === "reset" && (
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--accent)", fontSize: 13.5, fontWeight: 500,
                marginTop: 16, width: "100%", textAlign: "center",
              }}
            >
              ← Kembali ke halaman masuk
            </button>
          )}

          {isOfflineMode() && (
            <div style={{
              marginTop: 16, padding: "10px 13px",
              background: "var(--accent-soft)", borderRadius: "var(--radius-md)",
              fontSize: 12.5, color: "var(--accent-dark)", lineHeight: 1.5,
            }}>
              <strong>Mode Offline aktif</strong> — Data disimpan lokal di browser Anda.
              Atur <code>VITE_SUPABASE_URL</code> di <code>.env.local</code> untuk mengaktifkan sinkronisasi cloud.
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: 12, marginTop: 20 }}>
          Dengan mendaftar, Anda menyetujui Syarat Layanan dan Kebijakan Privasi kami.
        </p>
      </div>
    </div>
  );
}
