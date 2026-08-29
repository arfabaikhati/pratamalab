"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { AuthResponse } from "@/types";
import { AxiosError } from "axios";

export default function LoginPage() {
  const router   = useRouter();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", form);
      setAuth(data.user, data.access_token);

      // Fetch workspaces and redirect
      const { data: workspaces } = await api.get("/workspaces");
      if (workspaces.length > 0) {
        router.replace(`/workspace/${workspaces[0].id}`);
      } else {
        router.replace("/");
      }
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white text-xl font-bold mb-4">
            P
          </div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-secondary text-sm mt-1">Sign in to PratamaLab</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-600 hover:underline font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
