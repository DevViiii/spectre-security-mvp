"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { Card, StatCard, Badge, GradeBadge, Spinner, EmptyState } from "@/components/ui";
import { formatRelative } from "@/lib/utils/format";

async function fetchOverview() {
  const [scansRes, violationsRes, rulesRes] = await Promise.all([
    apiClient.get("/scans?limit=5"),
    apiClient.get("/shield/violations?limit=5"),
    apiClient.get("/rules/summary"),
  ]);
  return {
    scans: scansRes.data.data,
    violations: violationsRes.data.data,
    rules: rulesRes.data.data,
  };
}

export default function OverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: fetchOverview,
    refetchInterval: 30_000,
  });

  const scans = data?.scans?.scans ?? [];
  const violations = data?.violations?.violations ?? [];
  const completed = scans.filter((s: any) => s.status === "completed");
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum: number, s: any) => sum + (s.score ?? 0), 0) / completed.length)
    : null;

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}>
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "960px" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
        <StatCard label="Total scans" value={data?.scans?.total ?? 0} />
        <StatCard
          label="Avg security score"
          value={avgScore !== null ? `${avgScore}/100` : "—"}
          valueColor={avgScore !== null ? (avgScore >= 70 ? "#4ade80" : avgScore >= 45 ? "#fbbf24" : "#f87171") : undefined}
        />
        <StatCard label="Violations logged" value={data?.violations?.total ?? 0} />
        <StatCard label="Detection rules" value={data?.rules?.total_rules ?? 67} valueColor="#6ef2ff" />
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>

        {/* Recent scans */}
        <Card>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderBottom: "1px solid #111115",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#f0f0f2" }}>Recent scans</span>
            <Link href="/scanner" style={{ fontSize: "11px", color: "#6ef2ff", textDecoration: "none" }}>View all</Link>
          </div>
          <div style={{ padding: "8px" }}>
            {scans.length === 0 ? (
              <EmptyState
                title="No scans yet"
                description="Run your first scan to see results here"
                action={<Link href="/scanner" style={{ fontSize: "12px", color: "#6ef2ff", textDecoration: "none" }}>Start a scan →</Link>}
              />
            ) : scans.map((scan: any) => (
              <Link key={scan.id} href={`/scanner/${scan.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "8px", borderRadius: "6px",
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
                    <p style={{ fontSize: "11px", color: "#52525b", margin: 0, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {scan.target_url}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <Badge variant={scan.status as any}>{scan.status}</Badge>
                    <p style={{ fontSize: "10px", color: "#3f3f46", margin: "3px 0 0" }}>{formatRelative(scan.created_at)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent violations */}
        <Card>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderBottom: "1px solid #111115",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#f0f0f2" }}>Recent violations</span>
            <Link href="/shield/violations" style={{ fontSize: "11px", color: "#6ef2ff", textDecoration: "none" }}>View all</Link>
          </div>
          <div style={{ padding: "8px" }}>
            {violations.length === 0 ? (
              <EmptyState
                title="No violations yet"
                description="Configure Shield policies to start detecting"
                action={<Link href="/shield" style={{ fontSize: "12px", color: "#6ef2ff", textDecoration: "none" }}>Configure Shield →</Link>}
              />
            ) : violations.map((v: any) => (
              <div key={v.id} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px", borderRadius: "6px",
              }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                  background: v.action_taken === "block" ? "#f87171" : v.action_taken === "redact" ? "#fbbf24" : "#6ef2ff",
                }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", color: "#a1a1aa", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.policy_name ?? "Unknown policy"}
                  </p>
                  <p style={{ fontSize: "10px", color: "#3f3f46", margin: 0, fontFamily: "monospace" }}>{v.matched_pattern}</p>
                </div>
                <Badge variant={v.action_taken as any}>{v.action_taken}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detection coverage */}
      {data?.rules && (
        <Card style={{ padding: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#f0f0f2", marginBottom: "12px" }}>Detection coverage</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "8px" }}>
            {Object.entries(data.rules.categories ?? {}).map(([cat, counts]: [string, any]) => {
              const total = Object.values(counts as Record<string, number>).reduce((a: number, b: any) => a + b, 0);
              return (
                <div key={cat} style={{
                  background: "#111115", border: "1px solid #1a1a1f",
                  borderRadius: "8px", padding: "12px", textAlign: "center",
                }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#6ef2ff", margin: "0 0 4px" }}>{total}</p>
                  <p style={{ fontSize: "10px", color: "#52525b", margin: 0, textTransform: "capitalize" }}>
                    {cat.replace(/_/g, " ")}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginTop: "12px" }}>
        {[
          { label: "Run a scan", desc: "Test an LLM endpoint", href: "/scanner", cta: "New scan →" },
          { label: "Shield policies", desc: "Manage DLP rules", href: "/shield", cta: "View policies →" },
          { label: "Violation log", desc: "Review flagged content", href: "/shield/violations", cta: "View log →" },
        ].map((a) => (
          <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
            <Card style={{ padding: "16px", transition: "border-color 0.15s" }}
              onMouseEnter={(e: any) => (e.currentTarget.style.borderColor = "rgba(110,242,255,0.2)")}
              onMouseLeave={(e: any) => (e.currentTarget.style.borderColor = "#1a1a1f")}
            >
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#f0f0f2", margin: "0 0 3px" }}>{a.label}</p>
              <p style={{ fontSize: "12px", color: "#52525b", margin: "0 0 12px" }}>{a.desc}</p>
              <span style={{ fontSize: "12px", color: "#6ef2ff" }}>{a.cta}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
