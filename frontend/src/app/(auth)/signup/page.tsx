"use client";

import { useState } from "react";
import Link from "next/link";

function AuthBackground() {
  return (
    <>
      <style>{`
        @keyframes auroraPulse {
          0% { transform: translate(-3%,-2%) scale(1) rotate(0deg); }
          50% { transform: translate(2%,-1%) scale(1.08) rotate(12deg); }
          100% { transform: translate(0%,4%) scale(1.03) rotate(-10deg); }
        }
        @keyframes scanMove { 0% { top: -2px; } 100% { top: 100vh; } }
        @keyframes breathe { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:0.9; transform:scale(1.04); } }
        .auth-input:focus { border-color: rgba(110,242,255,0.4) !important; box-shadow: 0 0 12px rgba(110,242,255,0.15); }
        .auth-btn:hover:not(:disabled) { box-shadow: 0 0 24px rgba(110,242,255,0.3), 0 0 48px rgba(79,140,255,0.2); }
      `}</style>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, filter:"blur(60px)", opacity:0.5 }}>
        <div style={{ position:"absolute", inset:"-20%", background:"radial-gradient(closest-side, rgba(110,242,255,0.18), transparent 70%), radial-gradient(closest-side, rgba(138,107,255,0.18), transparent 68%)", animation:"auroraPulse 18s ease-in-out infinite alternate" }}/>
      </div>
      <svg style={{ position:"fixed", inset:0, opacity:0.04, pointerEvents:"none", zIndex:0, width:"100%", height:"100%" }}>
        <defs><pattern id="authgrid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6ef2ff" strokeWidth="0.5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#authgrid)"/>
      </svg>
      <div style={{ position:"fixed", left:0, right:0, height:"1px", background:"linear-gradient(90deg, transparent, rgba(110,242,255,0.4), transparent)", animation:"scanMove 10s linear infinite", pointerEvents:"none", zIndex:0, top:0 }}/>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, background:"radial-gradient(800px 380px at 50% 18%, rgba(110,242,255,0.1), transparent 60%)", animation:"breathe 10s ease-in-out infinite" }}/>
    </>
  );
}

function AuthLogo() {
  return (
    <div style={{ textAlign:"center", marginBottom:"32px" }}>
      <Link href="/" style={{ textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"12px" }}>
        <div style={{
          width:"40px", height:"40px", borderRadius:"10px",
          background:"linear-gradient(135deg, rgba(110,242,255,0.9), rgba(79,140,255,0.9) 45%, rgba(138,107,255,0.9))",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 0 20px rgba(110,242,255,0.3)",
        }}>
          <span style={{ fontSize:"18px", fontWeight:800, color:"#030810" }}>S</span>
        </div>
        <span style={{ fontSize:"18px", fontWeight:700, color:"#edf4ff", letterSpacing:"-0.3px" }}>
          Spectre <span style={{ color:"#6ef2ff" }}>Security</span>
        </span>
      </Link>
    </div>
  );
}

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
    <div style={{ minHeight:"100vh", background:"#03040a", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative", overflow:"hidden" }}>
      <AuthBackground />
      <div style={{ width:"100%", maxWidth:"420px", position:"relative", zIndex:1 }}>
        <AuthLogo />
        <div style={{
          background:"rgba(9,16,30,0.62)", border:"1px solid rgba(110,242,255,0.15)",
          borderRadius:"20px", padding:"36px", backdropFilter:"blur(16px)",
        }}>
          {!submitted ? (
            <>
              <h1 style={{ fontSize:"22px", fontWeight:700, color:"#edf4ff", letterSpacing:"-0.5px", marginBottom:"8px" }}>
                Get started free
              </h1>
              <p style={{ fontSize:"14px", color:"#9fb1d1", marginBottom:"28px", lineHeight:1.6 }}>
                Enter your work email and we&apos;ll send you a magic link to access your dashboard. No password needed.
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:"16px" }}>
                  <label style={{ display:"block", fontSize:"12px", fontWeight:600, color:"#9fb1d1", marginBottom:"6px", letterSpacing:"0.04em", textTransform:"uppercase" }}>
                    Work email
                  </label>
                  <input
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    style={{
                      width:"100%", padding:"12px 14px",
                      background:"#060608", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:"10px", color:"#edf4ff", fontSize:"15px",
                      outline:"none", boxSizing:"border-box", transition:"border-color 0.15s, box-shadow 0.15s",
                    }}
                  />
                </div>
                {error && (
                  <div style={{
                    background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)",
                    borderRadius:"10px", padding:"10px 14px", fontSize:"13px", color:"#f87171", marginBottom:"16px",
                  }}>{error}</div>
                )}
                <button
                  className="auth-btn"
                  type="submit"
                  disabled={loading || !email.trim()}
                  style={{
                    width:"100%", padding:"13px",
                    background:"linear-gradient(180deg, rgba(11,26,44,0.82), rgba(8,18,32,0.72))",
                    color: !email.trim() ? "#52525b" : "#edf4ff",
                    border:"1px solid rgba(110,242,255,0.28)", borderRadius:"999px",
                    fontSize:"15px", fontWeight:600,
                    cursor: loading ? "wait" : "pointer",
                    transition:"box-shadow 0.2s, opacity 0.15s",
                    opacity: !email.trim() ? 0.5 : 1,
                  }}
                >
                  {loading ? "Sending..." : "Send magic link →"}
                </button>
              </form>
              <div style={{ marginTop:"20px", paddingTop:"20px", borderTop:"1px solid rgba(255,255,255,0.06)", textAlign:"center" }}>
                <p style={{ fontSize:"13px", color:"#52525b" }}>
                  Already have an API key?{" "}
                  <Link href="/login" style={{ color:"#6ef2ff", textDecoration:"none" }}>Sign in with key</Link>
                </p>
              </div>
            </>
          ) : (
            <div style={{ textAlign:"center" }}>
              <div style={{
                width:"56px", height:"56px",
                background:"rgba(110,242,255,0.08)", border:"1px solid rgba(110,242,255,0.25)",
                borderRadius:"14px", display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 20px", fontSize:"24px",
              }}>✉️</div>
              <h2 style={{ fontSize:"20px", fontWeight:700, color:"#edf4ff", marginBottom:"10px" }}>Check your inbox</h2>
              <p style={{ fontSize:"14px", color:"#9fb1d1", lineHeight:1.7, marginBottom:"24px" }}>
                We sent a magic link to <strong style={{ color:"#6ef2ff" }}>{email}</strong>. Click the link in the email to access your dashboard.
              </p>
              <div style={{
                background:"rgba(6,6,8,0.6)", border:"1px solid rgba(255,255,255,0.06)",
                borderRadius:"10px", padding:"14px 16px", fontSize:"12px", color:"#52525b", lineHeight:1.6,
              }}>🔒 The link expires in 15 minutes and can only be used once. Check your spam folder if you don&apos;t see it.</div>
              <button
                onClick={() => { setSubmitted(false); setEmail(""); }}
                style={{ marginTop:"20px", background:"transparent", border:"none", color:"#6ef2ff", fontSize:"13px", cursor:"pointer" }}
              >Use a different email</button>
            </div>
          )}
        </div>
        <p style={{ textAlign:"center", fontSize:"12px", color:"#27272a", marginTop:"20px" }}>
          By signing up you agree to our terms of service. Your first 14 days are free.
        </p>
      </div>
    </div>
  );
}
