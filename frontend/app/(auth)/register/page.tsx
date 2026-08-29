"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { AuthResponse } from "@/types";
import { AxiosError } from "axios";

export default function RegisterPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({
    name: "", email: "", password: "", password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", form);
      setAuth(data.user, data.access_token, data.workspace);
      toast.success("Welcome to PratamaLab!");
      router.replace(`/workspace/${data.workspace?.id}`);
    } catch (err) {
      const error = err as AxiosError<{ message: string; errors?: Record<string, string[]> }>;
      const msg = Object.values(error.response?.data?.errors ?? {}).flat()[0]
               ?? error.response?.data?.message
               ?? "Registration failed";
      toast.error(msg);
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
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-secondary text-sm mt-1">Start building with PratamaLab</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm password</label>
            <input
              type="password"
              required
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
