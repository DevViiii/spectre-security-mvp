"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { Card, Badge, GradeBadge, Button, Spinner, EmptyState } from "@/components/ui";
import { formatRelative } from "@/lib/utils/format";

async function fetchScans() {
  const res = await apiClient.get("/scans?limit=20");
  return res.data.data;
}

function CreateScanModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", target_url: "", target_api_key: "", attack_suite: "quick" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/scans", form);
      qc.invalidateQueries({ queryKey: ["scans"] });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create scan");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "9px 12px",
    background: "#050508", border: "1px solid #1a1a1f",
    borderRadius: "6px", color: "#f0f0f2", fontSize: "13px",
    outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block", fontSize: "11px", fontWeight: 600,
    color: "#52525b", marginBottom: "6px", letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: "24px",
    }}>
      <div style={{
        background: "#0d0d11", border: "1px solid #1a1a1f",
        borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "440px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f2" }}>New scan</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", fontSize: "18px" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Scan name</label>
            <input style={inputStyle} placeholder="GPT-4 Security Audit" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = "rgba(110,242,255,0.3)")}
              onBlur={e => (e.target.style.borderColor = "#1a1a1f")}
            />
          </div>
          <div>
            <label style={labelStyle}>Target URL *</label>
            <input style={inputStyle} required placeholder="https://api.openai.com/v1/chat/completions"
              value={form.target_url} onChange={e => setForm(f => ({ ...f, target_url: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = "rgba(110,242,255,0.3)")}
              onBlur={e => (e.target.style.borderColor = "#1a1a1f")}
            />
          </div>
          <div>
            <label style={labelStyle}>Target API key</label>
            <input style={inputStyle} type="password" placeholder="sk-..."
              value={form.target_api_key} onChange={e => setForm(f => ({ ...f, target_api_key: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = "rgba(110,242,255,0.3)")}
              onBlur={e => (e.target.style.borderColor = "#1a1a1f")}
            />
          </div>
          <div>
            <label style={labelStyle}>Attack suite</label>
            <select style={{ ...inputStyle, cursor: "pointer" }}
              value={form.attack_suite} onChange={e => setForm(f => ({ ...f, attack_suite: e.target.value }))}>
              <option value="quick">Quick (critical attacks only)</option>
              <option value="full">Full (all 43 attacks)</option>
            </select>
          </div>

          {error && (
            <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "6px", padding: "10px 12px", fontSize: "12px", color: "#f87171" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px" }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <button type="submit" disabled={loading} style={{
              padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 500,
              background: "rgba(110,242,255,0.1)", border: "1px solid rgba(110,242,255,0.3)",
              color: "#6ef2ff", cursor: loading ? "wait" : "pointer",
            }}>
              {loading ? "Starting..." : "Start scan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ScannerPage() {
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["scans"], queryFn: fetchScans, refetchInterval: 5_000 });
  const scans = data?.scans ?? [];

  return (
    <div style={{ maxWidth: "960px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "14px", fontWeight: 500, color: "#f0f0f2", margin: 0 }}>Adversarial scans</h1>
          <p style={{ fontSize: "12px", color: "#52525b", margin: "3px 0 0" }}>{data?.total ?? 0} scans total</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 500,
          background: "rgba(110,242,255,0.08)", border: "1px solid rgba(110,242,255,0.2)",
          color: "#6ef2ff", cursor: "pointer",
        }}>
          <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span> New scan
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "60px" }}><Spinner size={24} /></div>
      ) : scans.length === 0 ? (
        <Card>
          <EmptyState
            title="No scans yet"
            description="Create your first scan to test an LLM endpoint for vulnerabilities."
            action={
              <button onClick={() => setShowModal(true)} style={{
                padding: "8px 16px", borderRadius: "6px", fontSize: "13px",
                background: "rgba(110,242,255,0.08)", border: "1px solid rgba(110,242,255,0.2)",
                color: "#6ef2ff", cursor: "pointer",
              }}>Start your first scan</button>
            }
          />
        </Card>
      ) : (
        <Card>
          <div style={{ padding: "8px" }}>
            {scans.map((scan: any, i: number) => (
              <Link key={scan.id} href={`/scanner/${scan.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px", borderRadius: "6px",
                  borderBottom: i < scans.length - 1 ? "1px solid #111115" : "none",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#111115")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <GradeBadge grade={scan.grade} score={scan.score} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#f0f0f2", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {scan.name || `Scan ${scan.id.slice(0, 8)}`}
                    </p>
                    <p style={{ fontSize: "11px", color: "#52525b", margin: "2px 0 0", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {scan.target_url}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                    <Badge variant={scan.status as any}>{scan.status}</Badge>
                    <span style={{ fontSize: "10px", color: "#3f3f46" }}>{formatRelative(scan.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {showModal && <CreateScanModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
