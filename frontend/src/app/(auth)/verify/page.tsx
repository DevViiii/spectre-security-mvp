"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, filter:"blur(60px)", opacity:0.5 }}>
        <div style={{ position:"absolute", inset:"-20%", background:"radial-gradient(closest-side, rgba(110,242,255,0.18), transparent 70%), radial-gradient(closest-side, rgba(138,107,255,0.18), transparent 68%)", animation:"auroraPulse 18s ease-in-out infinite alternate" }}/>
      </div>
      <svg style={{ position:"fixed", inset:0, opacity:0.04, pointerEvents:"none", zIndex:0, width:"100%", height:"100%" }}>
        <defs><pattern id="verifygrid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6ef2ff" strokeWidth="0.5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#verifygrid)"/>
      </svg>
      <div style={{ position:"fixed", left:0, right:0, height:"1px", background:"linear-gradient(90deg, transparent, rgba(110,242,255,0.4), transparent)", animation:"scanMove 10s linear infinite", pointerEvents:"none", zIndex:0, top:0 }}/>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, background:"radial-gradient(800px 380px at 50% 18%, rgba(110,242,255,0.1), transparent 60%)", animation:"breathe 10s ease-in-out infinite" }}/>
    </>
  );
}

function AuthLogo() {
  return (
    <div style={{ marginBottom:"40px" }}>
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

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No token found in the link. Please request a new magic link.");
      return;
    }
    async function verify() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
        const res = await fetch(`${apiBase}/auth/magic/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setTimeout(() => router.push("/overview"), 1500);
        } else {
          setStatus("error");
          setError(data?.detail || data?.error?.message || "This link is invalid or has expired.");
        }
      } catch {
        setStatus("error");
        setError("Unable to connect. Please try again.");
      }
    }
    verify();
  }, [token, router]);

  return (
    <div style={{ minHeight:"100vh", background:"#03040a", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative", overflow:"hidden" }}>
      <AuthBackground />
      <div style={{ width:"100%", maxWidth:"400px", textAlign:"center", position:"relative", zIndex:1 }}>
        <AuthLogo />

        {status === "verifying" && (
          <div>
            <div style={{
              width:"56px", height:"56px", margin:"0 auto 20px",
              border:"2px solid #6ef2ff", borderTopColor:"transparent",
              borderRadius:"50%", animation:"spin 0.8s linear infinite",
            }}/>
            <h2 style={{ fontSize:"20px", fontWeight:700, color:"#edf4ff", marginBottom:"8px" }}>Signing you in...</h2>
            <p style={{ fontSize:"14px", color:"#9fb1d1" }}>Verifying your magic link</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div style={{
              width:"56px", height:"56px", background:"rgba(34,197,94,0.1)",
              border:"1px solid rgba(34,197,94,0.3)", borderRadius:"14px",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 20px", fontSize:"24px", color:"#22c55e",
            }}>✓</div>
            <h2 style={{ fontSize:"20px", fontWeight:700, color:"#edf4ff", marginBottom:"8px" }}>You&apos;re in!</h2>
            <p style={{ fontSize:"14px", color:"#9fb1d1" }}>Redirecting to your dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div style={{
              width:"56px", height:"56px", background:"rgba(239,68,68,0.1)",
              border:"1px solid rgba(239,68,68,0.3)", borderRadius:"14px",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 20px", fontSize:"24px", color:"#ef4444",
            }}>✕</div>
            <h2 style={{ fontSize:"20px", fontWeight:700, color:"#edf4ff", marginBottom:"8px" }}>Link expired</h2>
            <p style={{ fontSize:"14px", color:"#9fb1d1", lineHeight:1.6, marginBottom:"24px" }}>{error}</p>
            <Link href="/signup" style={{
              display:"inline-block", padding:"12px 24px", borderRadius:"999px",
              border:"1px solid rgba(110,242,255,0.28)",
              background:"linear-gradient(180deg, rgba(11,26,44,0.82), rgba(8,18,32,0.72))",
              color:"#edf4ff", textDecoration:"none", fontSize:"14px", fontWeight:600,
            }}>
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
