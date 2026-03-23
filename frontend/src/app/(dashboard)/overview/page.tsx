"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { Spinner, Card, Badge } from "@/components/ui";
import { formatRelative, gradeColor, gradeBg } from "@/lib/utils/format";
import { clsx } from "clsx";

// ── Data fetching ──────────────────────────────────────────────────────────

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

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={clsx("font-display text-3xl font-700", accent ?? "text-zinc-100")}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </Card>
  );
}

// ── Recent scan row ────────────────────────────────────────────────────────

function ScanRow({ scan }: { scan: any }) {
  return (
    <Link
      href={`/scanner/${scan.id}`}
      className="flex items-center gap-4 py-3 px-4 hover:bg-obsidian-800/40 rounded-lg transition-colors"
    >
      <div
        className={clsx(
          "w-9 h-9 rounded-lg border flex items-center justify-center font-display text-base font-700 shrink-0",
          gradeBg(scan.grade)
        )}
      >
        {scan.grade ?? "—"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-500 text-zinc-200 truncate">
          {scan.name || `Scan ${scan.id.slice(0, 8)}`}
        </p>
        <p className="text-xs text-zinc-500 font-mono truncate">{scan.target_url}</p>
      </div>
      <div className="shrink-0 text-right">
        <Badge variant={scan.status}>{scan.status}</Badge>
        <p className="text-[10px] text-zinc-600 mt-1">{formatRelative(scan.created_at)}</p>
      </div>
    </Link>
  );
}

// ── Recent violation row ───────────────────────────────────────────────────

function ViolationRow({ v }: { v: any }) {
  const actionColor =
    v.action_taken === "block" ? "text-red-400" :
    v.action_taken === "redact" ? "text-amber-400" :
    "text-blue-400";

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-obsidian-800/40 rounded-lg transition-colors">
      <div className={clsx("w-2 h-2 rounded-full shrink-0", {
        "bg-red-400": v.action_taken === "block",
        "bg-amber-400": v.action_taken === "redact",
        "bg-blue-400": v.action_taken === "alert",
      })} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate">{v.policy_name ?? "Unknown policy"}</p>
        <p className="text-xs text-zinc-600 font-mono truncate">{v.matched_pattern ?? "—"}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className={clsx("text-xs font-500 capitalize", actionColor)}>{v.action_taken}</span>
        <p className="text-[10px] text-zinc-600 mt-1">{formatRelative(v.created_at)}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: fetchOverview,
    refetchInterval: 30_000,
  });

  const scans = data?.scans?.scans ?? [];
  const violations = data?.violations?.violations ?? [];
  const rules = data?.rules;

  const completedScans = scans.filter((s: any) => s.status === "completed");
  const avgScore = completedScans.length
    ? Math.round(completedScans.reduce((sum: number, s: any) => sum + (s.score ?? 0), 0) / completedScans.length)
    : null;

  const totalViolations = data?.violations?.total ?? 0;
  const blockCount = violations.filter((v: any) => v.action_taken === "block").length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-600 text-zinc-100">Overview</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Your AI security posture at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total scans"
          value={data?.scans?.total ?? 0}
          sub="all time"
        />
        <StatCard
          label="Avg security score"
          value={avgScore !== null ? `${avgScore}/100` : "—"}
          sub={completedScans.length > 0 ? `${completedScans.length} completed scans` : "no scans yet"}
          accent={avgScore !== null ? gradeColor(avgScore >= 90 ? "A" : avgScore >= 75 ? "B" : avgScore >= 60 ? "C" : avgScore >= 45 ? "D" : "F") : undefined}
        />
        <StatCard
          label="Violations logged"
          value={totalViolations}
          sub="by Shield"
        />
        <StatCard
          label="Detection rules"
          value={rules?.total_rules ?? 67}
          sub="active"
          accent="text-violet-glow"
        />
      </div>

      {/* Main content grid */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Recent scans */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-600">
            <h3 className="font-display text-sm font-600 text-zinc-200">Recent scans</h3>
            <Link href="/scanner" className="text-xs text-violet hover:text-violet-glow transition-colors">
              View all
            </Link>
          </div>
          <div className="p-2">
            {scans.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No scans yet.{" "}
                <Link href="/scanner" className="text-violet hover:underline">
                  Run your first scan
                </Link>
              </div>
            ) : (
              scans.map((scan: any) => <ScanRow key={scan.id} scan={scan} />)
            )}
          </div>
        </Card>

        {/* Recent violations */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-600">
            <h3 className="font-display text-sm font-600 text-zinc-200">Recent violations</h3>
            <Link href="/shield/violations" className="text-xs text-violet hover:text-violet-glow transition-colors">
              View all
            </Link>
          </div>
          <div className="p-2">
            {violations.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No violations yet.{" "}
                <Link href="/shield" className="text-violet hover:underline">
                  Configure Shield
                </Link>
              </div>
            ) : (
              violations.map((v: any) => <ViolationRow key={v.id} v={v} />)
            )}
          </div>
        </Card>
      </div>

      {/* Rule coverage */}
      {rules && (
        <Card className="p-5">
          <h3 className="font-display text-sm font-600 text-zinc-200 mb-4">Detection coverage</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(rules.categories ?? {}).map(([category, counts]: [string, any]) => {
              const total = Object.values(counts as Record<string, number>).reduce((a: number, b: any) => a + b, 0);
              return (
                <div key={category} className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-3 text-center">
                  <p className="font-display text-xl font-700 text-violet-glow">{total}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 capitalize">
                    {category.replace(/_/g, " ")}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label: "Run a scan", desc: "Test an LLM endpoint", href: "/scanner", cta: "New scan" },
          { label: "Shield policies", desc: "Manage DLP rules", href: "/shield", cta: "View policies" },
          { label: "Violation log", desc: "Review flagged content", href: "/shield/violations", cta: "View log" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-obsidian-900 border border-obsidian-600 hover:border-violet/30 rounded-xl p-4 transition-colors group"
          >
            <p className="text-sm font-500 text-zinc-200 mb-0.5">{action.label}</p>
            <p className="text-xs text-zinc-500 mb-3">{action.desc}</p>
            <span className="text-xs text-violet group-hover:text-violet-glow transition-colors">
              {action.cta} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
