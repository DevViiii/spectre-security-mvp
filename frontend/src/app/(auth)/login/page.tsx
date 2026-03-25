"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
        <defs><pattern id="logingrid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6ef2ff" strokeWidth="0.5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#logingrid)"/>
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
    <div style={{ minHeight:"100vh", background:"#03040a", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative", overflow:"hidden" }}>
      <AuthBackground />
      <div style={{ width:"100%", maxWidth:"420px", position:"relative", zIndex:1 }}>
        <AuthLogo />
        <div style={{
          background:"rgba(9,16,30,0.62)", border:"1px solid rgba(110,242,255,0.15)",
          borderRadius:"20px", padding:"36px", backdropFilter:"blur(16px)",
        }}>
          {/* Magic link CTA */}
          <div style={{
            background:"rgba(110,242,255,0.04)", border:"1px solid rgba(110,242,255,0.12)",
            borderRadius:"12px", padding:"16px", marginBottom:"24px", textAlign:"center",
          }}>
            <p style={{ fontSize:"13px", color:"#9fb1d1", marginBottom:"12px", lineHeight:1.5 }}>
              New to Spectre Security? Get instant access with just your email — no password needed.
            </p>
            <Link href="/signup" className="auth-btn" style={{
              display:"inline-block", padding:"10px 20px", borderRadius:"999px",
              border:"1px solid rgba(110,242,255,0.28)",
              background:"linear-gradient(180deg, rgba(11,26,44,0.82), rgba(8,18,32,0.72))",
              color:"#edf4ff", textDecoration:"none", fontSize:"14px", fontWeight:600,
              transition:"box-shadow 0.2s",
            }}>
              Get started free →
            </Link>
          </div>

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"24px" }}>
            <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.06)" }}/>
            <span style={{ fontSize:"11px", color:"#52525b", letterSpacing:"0.05em" }}>OR</span>
            <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.06)" }}/>
          </div>

          {/* API key login */}
          <h2 style={{ fontSize:"16px", fontWeight:600, color:"#9fb1d1", marginBottom:"16px" }}>
            Sign in with API key
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:"16px" }}>
              <label style={{ display:"block", fontSize:"11px", fontWeight:600, color:"#52525b", marginBottom:"6px", letterSpacing:"0.04em", textTransform:"uppercase" }}>
                API Key
              </label>
              <input
                className="auth-input"
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-spectre-..."
                style={{
                  width:"100%", padding:"11px 14px",
                  background:"#060608", border:"1px solid rgba(255,255,255,0.1)",
                  borderRadius:"10px", color:"#edf4ff", fontSize:"14px",
                  outline:"none", boxSizing:"border-box", fontFamily:"monospace",
                  transition:"border-color 0.15s, box-shadow 0.15s",
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
              type="submit"
              disabled={loading || !apiKey.trim()}
              style={{
                width:"100%", padding:"11px",
                background:"transparent",
                color: loading || !apiKey.trim() ? "#3f3f46" : "#9fb1d1",
                border:"1px solid rgba(255,255,255,0.1)", borderRadius:"999px",
                fontSize:"14px", fontWeight:500, cursor: loading ? "wait" : "pointer",
                transition:"border-color 0.15s",
              }}
            >
              {loading ? "Signing in..." : "Sign in with key"}
            </button>
          </form>
        </div>
        <p style={{ textAlign:"center", fontSize:"12px", color:"#27272a", marginTop:"16px" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color:"#6ef2ff", textDecoration:"none" }}>Get started free</Link>
        </p>
      </div>
    </div>
  );
}
