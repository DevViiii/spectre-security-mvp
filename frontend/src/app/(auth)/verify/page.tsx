"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok && data?.data?.api_key) {
          // Store API key as cookie (same as existing login flow)
          document.cookie = `spectre_api_key=${data.data.api_key}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
          setStatus("success");
          // Redirect to overview after brief success state
          setTimeout(() => {
            router.push("/overview");
          }, 1500);
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
    <div style={{
      minHeight: "100vh", background: "#060608",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
        {/* Logo */}
        <div style={{ marginBottom: "40px" }}>
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

        {/* Verifying state */}
        {status === "verifying" && (
          <div>
            <div style={{
              width: "56px", height: "56px", margin: "0 auto 20px",
              border: "2px solid #7c3aed", borderTopColor: "transparent",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }}/>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f4f4f5", marginBottom: "8px" }}>
              Signing you in...
            </h2>
            <p style={{ fontSize: "14px", color: "#71717a" }}>
              Verifying your magic link
            </p>
          </div>
        )}

        {/* Success state */}
        {status === "success" && (
          <div>
            <div style={{
              width: "56px", height: "56px", background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)", borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: "24px",
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f4f4f5", marginBottom: "8px" }}>
              You're in!
            </h2>
            <p style={{ fontSize: "14px", color: "#71717a" }}>
              Redirecting to your dashboard...
            </p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div>
            <div style={{
              width: "56px", height: "56px", background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)", borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: "24px",
            }}>
              ✕
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f4f4f5", marginBottom: "8px" }}>
              Link expired
            </h2>
            <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.6, marginBottom: "24px" }}>
              {error}
            </p>
            <Link
              href="/signup"
              style={{
                display: "inline-block", background: "#7c3aed", color: "white",
                padding: "12px 24px", borderRadius: "8px", textDecoration: "none",
                fontSize: "14px", fontWeight: 600,
              }}
            >
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
