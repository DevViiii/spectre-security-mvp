"use client";

import { useState } from "react";
import Link from "next/link";
import { useViolations } from "@/lib/hooks";
import { Badge, Button, Card, Spinner, EmptyState } from "@/components/ui";
import { formatDate, formatRelative } from "@/lib/utils/format";
import { clsx } from "clsx";

// ── CSV export ─────────────────────────────────────────────────────────────

function exportToCSV(violations: any[]) {
  const headers = ["ID", "Policy", "Direction", "Action", "Pattern", "Excerpt", "Created"];
  const rows = violations.map((v) => [
    v.id,
    v.policy_name ?? v.policy_id,
    v.direction,
    v.action_taken,
    v.matched_pattern ?? "",
    (v.context_excerpt ?? "").replace(/"/g, '""'),
    v.created_at,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spectre-violations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Violation row ──────────────────────────────────────────────────────────

function ViolationRow({ v }: { v: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-obsidian-700 hover:bg-obsidian-800/30 cursor-pointer transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-4 py-3 text-xs text-zinc-400">{formatRelative(v.created_at)}</td>
        <td className="px-4 py-3 text-xs font-500 text-zinc-200">{v.policy_name ?? "—"}</td>
        <td className="px-4 py-3">
          <span className={clsx(
            "text-[11px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border",
            v.direction === "input"
              ? "text-blue-400 bg-blue-950/50 border-blue-900/60"
              : "text-purple-400 bg-purple-950/50 border-purple-900/60"
          )}>
            {v.direction}
          </span>
        </td>
        <td className="px-4 py-3">
          <Badge variant={v.action_taken}>{v.action_taken}</Badge>
        </td>
        <td className="px-4 py-3 text-xs font-mono text-zinc-500 max-w-[180px] truncate">
          {v.matched_pattern ?? "—"}
        </td>
        <td className="px-4 py-3 text-xs text-zinc-500 max-w-[200px] truncate">
          {v.context_excerpt?.slice(0, 60) ?? "—"}
          {v.context_excerpt?.length > 60 ? "…" : ""}
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
        <tr className="border-b border-obsidian-700 bg-obsidian-900/60">
          <td colSpan={7} className="px-4 py-4">
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-zinc-500 uppercase tracking-wide mb-1">Policy ID</p>
                  <p className="font-mono text-zinc-400">{v.policy_id}</p>
                </div>
                <div>
                  <p className="text-zinc-500 uppercase tracking-wide mb-1">Violation ID</p>
                  <p className="font-mono text-zinc-400">{v.id}</p>
                </div>
                <div>
                  <p className="text-zinc-500 uppercase tracking-wide mb-1">Timestamp</p>
                  <p className="text-zinc-400">{formatDate(v.created_at)}</p>
                </div>
              </div>
              {v.context_excerpt && (
                <div>
                  <p className="text-zinc-500 uppercase tracking-wide mb-1">Context excerpt</p>
                  <pre className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-3 text-zinc-300 whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {v.context_excerpt}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ViolationsPage() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");

  const { data, isLoading } = useViolations({ limit: 100 });
  const violations: any[] = data?.violations ?? [];

  const filtered = violations.filter((v) => {
    if (actionFilter !== "all" && v.action_taken !== actionFilter) return false;
    if (directionFilter !== "all" && v.direction !== directionFilter) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Link href="/shield" className="hover:text-zinc-300 transition-colors">Shield</Link>
            <span>/</span>
            <span className="text-zinc-300">Violations</span>
          </div>
          <h2 className="font-display text-lg font-600 text-zinc-100">Violation log</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{filtered.length} events</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportToCSV(filtered)}
          disabled={filtered.length === 0}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v8M3.5 6l3 3 3-3M1 11.5h11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-zinc-500">Action:</span>
        {["all", "block", "redact", "alert"].map((f) => (
          <button
            key={f}
            onClick={() => setActionFilter(f)}
            className={clsx(
              "px-2.5 py-1 rounded text-xs capitalize transition-colors",
              actionFilter === f
                ? "bg-violet/15 text-violet border border-violet/30"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {f}
          </button>
        ))}
        <span className="text-xs text-zinc-600 mx-1">·</span>
        <span className="text-xs text-zinc-500">Direction:</span>
        {["all", "input", "output"].map((f) => (
          <button
            key={f}
            onClick={() => setDirectionFilter(f)}
            className={clsx(
              "px-2.5 py-1 rounded text-xs capitalize transition-colors",
              directionFilter === f
                ? "bg-violet/15 text-violet border border-violet/30"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No violations found"
            description={violations.length > 0 ? "No violations match the current filters." : "Shield is active. Violations will appear here when policies are triggered."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-obsidian-700">
                  {["Time", "Policy", "Direction", "Action", "Pattern", "Context", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] text-zinc-500 uppercase tracking-wide font-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v: any) => <ViolationRow key={v.id} v={v} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
