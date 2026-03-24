"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiBase}/auth/magic/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data?.detail || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060608",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Grid background */}
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

        {/* Card */}
        <div style={{
          background: "#0d0d1a",
          border: "1px solid #1c1c2e",
          borderRadius: "16px",
          padding: "36px",
        }}>
          {!submitted ? (
            <>
              <h1 style={{
                fontSize: "22px", fontWeight: 700, color: "#f4f4f5",
                letterSpacing: "-0.5px", marginBottom: "8px",
              }}>
                Get started free
              </h1>
              <p style={{ fontSize: "14px", color: "#71717a", marginBottom: "28px", lineHeight: 1.6 }}>
                Enter your work email and we'll send you a magic link to access your dashboard. No password needed.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{
                    display: "block", fontSize: "12px", fontWeight: 600,
                    color: "#71717a", marginBottom: "6px", letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}>
                    Work email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    style={{
                      width: "100%", padding: "12px 14px",
                      background: "#060608", border: "1px solid #27272a",
                      borderRadius: "8px", color: "#f4f4f5", fontSize: "15px",
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.15s",
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
                  disabled={loading || !email.trim()}
                  style={{
                    width: "100%", padding: "13px",
                    background: loading || !email.trim() ? "#4c1d95" : "#7c3aed",
                    color: "white", border: "none", borderRadius: "8px",
                    fontSize: "15px", fontWeight: 600, cursor: loading ? "wait" : "pointer",
                    transition: "background 0.15s", opacity: !email.trim() ? 0.6 : 1,
                  }}
                >
                  {loading ? "Sending..." : "Send magic link →"}
                </button>
              </form>

              <div style={{
                marginTop: "20px", paddingTop: "20px",
                borderTop: "1px solid #1c1c2e", textAlign: "center",
              }}>
                <p style={{ fontSize: "13px", color: "#3f3f46" }}>
                  Already have an API key?{" "}
                  <Link href="/login" style={{ color: "#7c3aed", textDecoration: "none" }}>
                    Sign in with key
                  </Link>
                </p>
              </div>
            </>
          ) : (
            /* Success state */
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "56px", height: "56px", background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.3)", borderRadius: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: "24px",
              }}>
                ✉️
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f4f4f5", marginBottom: "10px" }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.7, marginBottom: "24px" }}>
                We sent a magic link to <strong style={{ color: "#a1a1aa" }}>{email}</strong>.
                Click the link in the email to access your dashboard.
              </p>
              <div style={{
                background: "#060608", border: "1px solid #1c1c2e",
                borderRadius: "8px", padding: "14px 16px",
                fontSize: "12px", color: "#52525b", lineHeight: 1.6,
              }}>
                🔒 The link expires in 15 minutes and can only be used once.
                Check your spam folder if you don't see it.
              </div>
              <button
                onClick={() => { setSubmitted(false); setEmail(""); }}
                style={{
                  marginTop: "20px", background: "transparent", border: "none",
                  color: "#7c3aed", fontSize: "13px", cursor: "pointer",
                }}
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "12px", color: "#27272a", marginTop: "20px" }}>
          By signing up you agree to our terms of service.
          Your first 14 days are free.
        </p>
      </div>
    </div>
  );
}
