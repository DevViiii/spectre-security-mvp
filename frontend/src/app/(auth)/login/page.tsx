"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setError("");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiBase}/health`, {
        headers: { "X-Api-Key": apiKey.trim() },
      });

      if (res.ok) {
        document.cookie = `spectre_api_key=${apiKey.trim()}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        router.push("/overview");
      } else {
        setError("Invalid API key. Check your key and try again.");
      }
    } catch {
      setError("Unable to connect to the API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#060608",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      <svg style={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none" }} width="100%" height="100%">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#7c3aed" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "40px", height: "40px", background: "#7c3aed",
              borderRadius: "10px", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "20px", fontWeight: 800, color: "white",
            }}>S</div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#f4f4f5", letterSpacing: "-0.3px" }}>
              Spectre <span style={{ color: "#7c3aed" }}>Security</span>
            </span>
          </Link>
        </div>

        <div style={{
          background: "#0d0d1a", border: "1px solid #1c1c2e",
          borderRadius: "16px", padding: "36px",
        }}>
          {/* Magic link CTA — primary */}
          <div style={{
            background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: "10px", padding: "16px", marginBottom: "24px", textAlign: "center",
          }}>
            <p style={{ fontSize: "13px", color: "#a1a1aa", marginBottom: "12px", lineHeight: 1.5 }}>
              New to Spectre Security? Get instant access with just your email — no password needed.
            </p>
            <Link
              href="/signup"
              style={{
                display: "inline-block", background: "#7c3aed", color: "white",
                padding: "10px 20px", borderRadius: "8px", textDecoration: "none",
                fontSize: "14px", fontWeight: 600,
              }}
            >
              Get started free →
            </Link>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ flex: 1, height: "1px", background: "#1c1c2e" }}/>
            <span style={{ fontSize: "11px", color: "#3f3f46", letterSpacing: "0.05em" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#1c1c2e" }}/>
          </div>

          {/* API key login — secondary */}
          <h2 style={{
            fontSize: "16px", fontWeight: 600, color: "#71717a",
            marginBottom: "16px",
          }}>
            Sign in with API key
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block", fontSize: "11px", fontWeight: 600,
                color: "#52525b", marginBottom: "6px", letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}>
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-spectre-..."
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "#060608", border: "1px solid #27272a",
                  borderRadius: "8px", color: "#f4f4f5", fontSize: "14px",
                  outline: "none", boxSizing: "border-box", fontFamily: "monospace",
                }}
                onFocus={e => (e.target.style.borderColor = "#7c3aed")}
                onBlur={e => (e.target.style.borderColor = "#27272a")}
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "8px", padding: "10px 14px",
                fontSize: "13px", color: "#f87171", marginBottom: "16px",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              style={{
                width: "100%", padding: "11px",
                background: "transparent",
                color: loading || !apiKey.trim() ? "#3f3f46" : "#71717a",
                border: "1px solid #27272a", borderRadius: "8px",
                fontSize: "14px", fontWeight: 500,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign in with key"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#27272a", marginTop: "16px" }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: "#7c3aed", textDecoration: "none" }}>
            Get started free
          </Link>
        </p>
      </div>
    </div>
  );
}
