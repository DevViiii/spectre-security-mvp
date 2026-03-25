"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Card, Button, Spinner, Badge, EmptyState } from "@/components/ui";
import { formatDate, formatRelative, gradeBg, gradeColor } from "@/lib/utils/format";
import { clsx } from "clsx";

// ── Data fetching ──────────────────────────────────────────────────────────

async function fetchScansWithReports() {
  const res = await apiClient.get("/scans?limit=50");
  const scans = res.data.data?.scans ?? [];
  return scans.filter((s: any) => s.status === "completed");
}

async function generateReport(scanId: string) {
  const res = await apiClient.post(`/reports/${scanId}/generate`);
  return res.data.data;
}

// ── Report card ────────────────────────────────────────────────────────────

function ReportCard({ scan }: { scan: any }) {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const generate = useMutation({
    mutationFn: () => generateReport(scan.id),
    onMutate: () => setGenerating(true),
    onSettled: () => {
      setGenerating(false);
      setTimeout(() => qc.invalidateQueries({ queryKey: ["reports"] }), 5000);
    },
  });

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  function downloadReport() {
    const url = scan.report_url?.startsWith("http")
      ? scan.report_url
      : `${apiBase}${scan.report_url}`;
    window.open(url, "_blank");
  }

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={clsx(
                "w-10 h-10 rounded-xl border flex items-center justify-center font-display text-lg font-700 shrink-0",
                gradeBg(scan.grade)
              )}
            >
              {scan.grade}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-500 text-zinc-200 truncate">
                {scan.name || `Scan ${scan.id.slice(0, 8)}`}
              </p>
              <p className="text-xs text-zinc-500 font-mono truncate">{scan.target_url}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {scan.report_url ? (
              <Button variant="primary" size="sm" onClick={downloadReport}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1v8M3.5 6l3 3 3-3M1 11.5h11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download PDF
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled={generating || generate.isPending}
                onClick={() => generate.mutate()}
              >
                {generating || generate.isPending ? <Spinner className="w-3 h-3" /> : null}
                {generating || generate.isPending ? "Generating…" : "Generate report"}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="bg-[#0d0d11] border border-[#1a1a1f] rounded-lg px-3 py-2 text-center">
            <p className={clsx("font-display text-lg font-700", gradeColor(scan.grade))}>
              {scan.score ?? "—"}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Score</p>
          </div>
          <div className="bg-[#0d0d11] border border-[#1a1a1f] rounded-lg px-3 py-2 text-center">
            <p className={clsx(
              "font-display text-lg font-700",
              (scan.failed_attacks ?? 0) > 0 ? "text-red-400" : "text-green-400"
            )}>
              {scan.failed_attacks ?? 0}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Vulns</p>
          </div>
          <div className="bg-[#0d0d11] border border-[#1a1a1f] rounded-lg px-3 py-2 text-center">
            <p className="font-display text-lg font-700 text-zinc-300">
              {scan.total_attacks ?? 0}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Attacks</p>
          </div>
          <div className="bg-[#0d0d11] border border-[#1a1a1f] rounded-lg px-3 py-2 text-center">
            <p className="font-display text-xs font-600 text-zinc-400 capitalize">
              {scan.attack_suite}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Suite</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-600">
          <span>Scan ID: {scan.id.slice(0, 8)}…</span>
          <span>Completed {formatRelative(scan.completed_at)}</span>
        </div>
      </div>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { data: scans, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: fetchScansWithReports,
    refetchInterval: 10_000,
  });

  const withReports = scans?.filter((s: any) => s.report_url) ?? [];
  const withoutReports = scans?.filter((s: any) => !s.report_url) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display text-lg font-600 text-[#f0f0f2]">Reports</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          {scans?.length ?? 0} completed scan{scans?.length !== 1 ? "s" : ""} ·{" "}
          {withReports.length} report{withReports.length !== 1 ? "s" : ""} generated
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6" />
        </div>
      ) : scans?.length === 0 ? (
        <Card>
          <EmptyState
            title="No completed scans"
            description="Run a scan first. Reports are generated from completed scans."
            action={
              <Button variant="primary" onClick={() => window.location.href = "/scanner"}>
                Go to Scanner
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {withReports.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">
                Ready to download
              </p>
              <div className="space-y-3">
                {withReports.map((scan: any) => (
                  <ReportCard key={scan.id} scan={scan} />
                ))}
              </div>
            </div>
          )}

          {withoutReports.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">
                Report not yet generated
              </p>
              <div className="space-y-3">
                {withoutReports.map((scan: any) => (
                  <ReportCard key={scan.id} scan={scan} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
