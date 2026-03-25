"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useScanDetail, useGenerateReport, useDeleteScan } from "@/lib/hooks";
import { Badge, Button, Card, Spinner, EmptyState } from "@/components/ui";
import { formatDate, formatRelative, gradeColor, gradeBg } from "@/lib/utils/format";
import { clsx } from "clsx";

// ── Grade display ──────────────────────────────────────────────────────────

function GradeCircle({ grade, score }: { grade: string | null; score: number | null }) {
  const color = gradeColor(grade);
  const bg = gradeBg(grade);
  return (
    <div className="flex items-center gap-6">
      <div
        className={clsx(
          "w-20 h-20 rounded-2xl border-2 flex items-center justify-center font-display text-4xl font-800 shrink-0",
          bg
        )}
      >
        {grade ?? "—"}
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className={clsx("text-4xl font-display font-700", color)}>
            {score ?? "—"}
          </span>
          <span className="text-zinc-500 text-lg">/100</span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">Security score</p>
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-[#0d0d11] border border-[#1a1a1f] rounded-xl px-4 py-3">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-display text-xl font-600 text-[#f0f0f2]">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Finding row ────────────────────────────────────────────────────────────

function FindingRow({ finding }: { finding: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-[#1a1a1f] hover:bg-[#0d0d11]/40 cursor-pointer transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-4 py-3 font-mono text-xs text-zinc-500">{finding.attack_id}</td>
        <td className="px-4 py-3 text-xs text-zinc-400 capitalize">
          {finding.category.replace(/_/g, " ")}
        </td>
        <td className="px-4 py-3">
          <Badge variant={finding.severity}>{finding.severity}</Badge>
        </td>
        <td className="px-4 py-3">
          <Badge variant={finding.status}>{finding.status}</Badge>
        </td>
        <td className="px-4 py-3 text-xs text-zinc-500 font-mono max-w-xs truncate">
          {finding.payload?.slice(0, 80)}
          {finding.payload?.length > 80 ? "…" : ""}
        </td>
        <td className="px-4 py-3 text-right">
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={clsx("text-zinc-500 transition-transform", expanded ? "rotate-180" : "")}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-[#1a1a1f] bg-[#0d0d11]">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-zinc-500 uppercase tracking-wide mb-2">Payload</p>
                <pre className="bg-[#0d0d11] border border-[#1a1a1f] rounded-lg p-3 text-zinc-300 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-32 overflow-y-auto">
                  {finding.payload ?? "—"}
                </pre>
              </div>
              <div>
                <p className="text-zinc-500 uppercase tracking-wide mb-2">
                  Model response
                  {finding.classifier_used && (
                    <span className="ml-2 text-zinc-600 normal-case">
                      via {finding.classifier_used}
                    </span>
                  )}
                </p>
                <pre className="bg-[#0d0d11] border border-[#1a1a1f] rounded-lg p-3 text-zinc-300 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-32 overflow-y-auto">
                  {finding.response_excerpt ?? "—"}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Severity breakdown ─────────────────────────────────────────────────────

function SeverityBreakdown({ findings }: { findings: any[] }) {
  const severities = ["critical", "high", "medium", "low"] as const;
  const counts = severities.map((s) => ({
    severity: s,
    total: findings.filter((f) => f.severity === s).length,
    failed: findings.filter((f) => f.severity === s && f.status === "failed").length,
  }));

  return (
    <div className="grid grid-cols-4 gap-3">
      {counts.map(({ severity, total, failed }) => (
        <div
          key={severity}
          className="bg-[#0d0d11] border border-[#1a1a1f] rounded-xl p-3 text-center"
        >
          <Badge variant={severity} className="mb-2">{severity}</Badge>
          <p className="font-display text-2xl font-700 text-[#f0f0f2]">{failed}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">of {total} failed</p>
        </div>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: scan, isLoading } = useScanDetail(id);
  const generateReport = useGenerateReport();
  const deleteScan = useDeleteScan();
  const [filter, setFilter] = useState<string>("all");

  async function handleDelete() {
    if (!confirm("Delete this scan and all its findings?")) return;
    await deleteScan.mutateAsync(id);
    router.push("/scanner");
  }

  async function handleGenerateReport() {
    await generateReport.mutateAsync(id);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (!scan) {
    return (
      <Card>
        <EmptyState title="Scan not found" description="This scan may have been deleted." />
      </Card>
    );
  }

  const findings = scan.findings ?? [];
  const filtered =
    filter === "all" ? findings : findings.filter((f: any) => f.status === filter);

  const isActive = scan.status === "pending" || scan.status === "running";

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/scanner" className="hover:text-zinc-300 transition-colors">
          Scanner
        </Link>
        <span>/</span>
        <span className="text-zinc-300">
          {scan.name || `Scan ${id.slice(0, 8)}`}
        </span>
      </div>

      {/* Header */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display text-lg font-600 text-[#f0f0f2]">
                {scan.name || `Scan ${id.slice(0, 8)}`}
              </h2>
              <Badge variant={scan.status}>{scan.status}</Badge>
            </div>
            <p className="text-xs font-mono text-zinc-500 mb-4 truncate">
              {scan.target_url}
            </p>
            {isActive ? (
              <div className="flex items-center gap-2 text-sm text-[#6ef2ff]">
                <Spinner className="w-4 h-4 text-[#6ef2ff]" />
                Scan running — results will appear automatically…
              </div>
            ) : scan.grade ? (
              <GradeCircle grade={scan.grade} score={scan.score} />
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {scan.status === "completed" && (
              <>
                {scan.report_url ? (
                  <a
                    href={(() => {
                      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
                      return scan.report_url.startsWith("http") ? scan.report_url : `${base}${scan.report_url}`;
                    })()}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border font-500 transition-all duration-100 px-3 py-1.5 text-xs text-[#6ef2ff] border-[rgba(110,242,255,0.2)] hover:bg-[rgba(110,242,255,0.08)]"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1v8M3.5 6l3 3 3-3M1 11.5h11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download PDF
                  </a>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={generateReport.isPending}
                    onClick={handleGenerateReport}
                  >
                    {generateReport.isPending ? <Spinner className="w-3 h-3" /> : null}
                    Generate report
                  </Button>
                )}
              </>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleteScan.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      {scan.status === "completed" && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Total attacks" value={scan.total_attacks ?? "—"} />
            <Stat
              label="Vulnerabilities"
              value={
                <span className={scan.failed_attacks > 0 ? "text-red-400" : "text-green-400"}>
                  {scan.failed_attacks ?? "—"}
                </span>
              }
              sub={scan.failed_attacks > 0 ? "model was compromised" : "all attacks resisted"}
            />
            <Stat label="Attack suite" value={scan.attack_suite} />
            <Stat
              label="Completed"
              value={scan.completed_at ? formatRelative(scan.completed_at) : "—"}
              sub={scan.completed_at ? formatDate(scan.completed_at) : undefined}
            />
          </div>

          {findings.length > 0 && <SeverityBreakdown findings={findings} />}
        </>
      )}

      {/* Findings table */}
      {findings.length > 0 && (
        <Card>
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1f]">
            <h3 className="font-display text-sm font-600 text-zinc-200">Findings</h3>
            <div className="flex items-center gap-1">
              {["all", "failed", "passed", "error"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={clsx(
                    "px-2.5 py-1 rounded text-xs transition-colors capitalize",
                    filter === s
                      ? "bg-[rgba(110,242,255,0.1)] text-[#6ef2ff] border border-[rgba(110,242,255,0.2)]"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {s}
                  <span className="ml-1 text-zinc-600">
                    ({s === "all" ? findings.length : findings.filter((f: any) => f.status === s).length})
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a1a1f]">
                  {["ID", "Category", "Severity", "Status", "Payload (excerpt)", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] text-zinc-500 uppercase tracking-wide font-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f: any) => (
                  <FindingRow key={f.id} finding={f} />
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-zinc-500">
              No {filter} findings.
            </div>
          )}
        </Card>
      )}

      {scan.status === "failed" && (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.25" />
              <path d="M10 6v5M10 13v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-sm font-500 text-red-400 mb-1">Scan failed</p>
              <p className="text-xs text-zinc-500 font-mono">{scan.error_message}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
