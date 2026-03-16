"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError("");

    try {
      // Verify the key is valid by hitting a protected endpoint
      await apiClient.get("/auth", {
        headers: { "X-Api-Key": key.trim() },
      });
      // Store in cookie (httpOnly would be ideal — for pilot, js-accessible is fine)
      document.cookie = `spectre_api_key=${key.trim()}; path=/; max-age=86400; SameSite=Strict`;
      router.push("/scanner");
    } catch {
      setError("Invalid API key. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-obsidian-950 bg-grid-obsidian bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Violet glow backdrop */}
      <div
        aria-hidden
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(ellipse, #7c3aed 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-sm animate-slide-up relative z-10">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            {/* Ghost icon */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 3C8.48 3 4 7.48 4 13v10l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5V13c0-5.52-4.48-10-10-10z"
                fill="#7c3aed" opacity="0.9"
              />
              <circle cx="10" cy="13" r="1.5" fill="#0d0d12" />
              <circle cx="18" cy="13" r="1.5" fill="#0d0d12" />
            </svg>
            <span className="font-display text-2xl font-700 tracking-tight text-zinc-50">
              Spectre
              <span className="text-violet"> Security</span>
            </span>
          </div>
          <p className="text-xs text-zinc-500 tracking-widest uppercase">
            Operator Console
          </p>
        </div>

        {/* Card */}
        <div className="bg-obsidian-900 border border-obsidian-600 rounded-xl p-8 shadow-violet">
          <h1 className="font-display text-lg font-600 text-zinc-100 mb-1">
            Sign in
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            Enter your API key to access the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 tracking-wide uppercase">
                API Key
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-spectre-..."
                autoComplete="current-password"
                spellCheck={false}
                className="w-full bg-obsidian-800 border border-obsidian-500 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono focus-violet transition-colors focus:border-violet/50 outline-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2.5">
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 16 16">
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !key.trim()}
              className="w-full bg-violet hover:bg-violet-dim disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 text-sm font-500 transition-all duration-150 focus-violet"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                    <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Verifying…
                </span>
              ) : "Access console"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          No key? Contact your Spectre administrator.
        </p>
      </div>
    </div>
  );
}
