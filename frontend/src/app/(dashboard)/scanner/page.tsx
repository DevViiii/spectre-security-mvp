"use client";

import { useState } from "react";
import Link from "next/link";
import { useScans, useCreateScan, useDeleteScan } from "@/lib/hooks";
import { Badge, Button, Card, Spinner, EmptyState } from "@/components/ui";
import { formatRelative, gradeColor, gradeBg } from "@/lib/utils/format";
import { clsx } from "clsx";

// ── Create Scan Modal ──────────────────────────────────────────────────────

function CreateScanModal({ onClose }: { onClose: () => void }) {
  const createScan = useCreateScan();
  const [form, setForm] = useState({
    name: "",
    target_url: "",
    target_api_key: "",
    attack_suite: "full" as const,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createScan.mutateAsync({
        ...form,
        target_api_key: form.target_api_key || undefined,
        name: form.name || undefined,
      });
      onClose();
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,6,8,0.85)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-obsidian-900 border border-obsidian-500 rounded-xl w-full max-w-md shadow-violet animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian-600">
          <h2 className="font-display text-sm font-600 text-zinc-100">New scan</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Scan name (optional)">
            <Input
              placeholder="Production chatbot — Q1 audit"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
          </Field>

          <Field label="Target endpoint URL *">
            <Input
              placeholder="https://api.example.com/v1/chat/completions"
              value={form.target_url}
              onChange={(v) => setForm((f) => ({ ...f, target_url: v }))}
              required
            />
          </Field>

          <Field label="Target API key (optional)">
            <Input
              type="password"
              placeholder="sk-... (sent in Authorization header)"
              value={form.target_api_key}
              onChange={(v) => setForm((f) => ({ ...f, target_api_key: v }))}
            />
          </Field>

          <Field label="Attack suite">
            <select
              value={form.attack_suite}
              onChange={(e) => setForm((f) => ({ ...f, attack_suite: e.target.value as any }))}
              className="w-full bg-obsidian-800 border border-obsidian-500 rounded-lg px-3 py-2 text-sm text-zinc-200 focus-violet outline-none"
            >
              <option value="full">Full (43 attacks)</option>
              <option value="quick">Quick (critical + high only)</option>
              <option value="injection_only">Prompt injection only</option>
              <option value="jailbreak_only">Jailbreak only</option>
            </select>
          </Field>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!form.target_url || createScan.isPending}
              className="flex-1"
            >
              {createScan.isPending ? <Spinner className="w-3.5 h-3.5" /> : null}
              {createScan.isPending ? "Queuing…" : "Start scan"}
            </Button>
          </div>

          {createScan.isError && (
            <p className="text-xs text-red-400">Failed to create scan. Check the target URL.</p>
          )}
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full bg-obsidian-800 border border-obsidian-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus-violet outline-none transition-colors"
    />
  );
}

// ── Scan status indicator ──────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const color =
    status === "running" ? "bg-violet animate-pulse-slow" :
    status === "completed" ? "bg-green-400" :
    status === "failed" ? "bg-red-400" :
    "bg-zinc-600";
  return <span className={clsx("inline-block w-1.5 h-1.5 rounded-full", color)} />;
}

// ── Scanner page ───────────────────────────────────────────────────────────

export default function ScannerPage() {
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading } = useScans();
  const deleteScaan = useDeleteScan();

  const scans = data?.scans ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-600 text-zinc-100">Adversarial scans</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {scans.length} scan{scans.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New scan
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="w-6 h-6" />
        </div>
      ) : scans.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v5M12 15v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
            title="No scans yet"
            description="Create your first scan to test an LLM endpoint for vulnerabilities."
            action={
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Start your first scan
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {scans.map((scan: any) => (
            <Card key={scan.id}>
              <Link
                href={`/scanner/${scan.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-obsidian-800/40 transition-colors rounded-xl"
              >
                {/* Status dot */}
                <StatusDot status={scan.status} />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-500 text-zinc-200 truncate">
                      {scan.name || `Scan ${scan.id.slice(0, 8)}`}
                    </span>
                    <Badge variant={scan.status}>{scan.status}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono truncate">
                    {scan.target_url}
                  </p>
                </div>

                {/* Grade */}
                {scan.grade ? (
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-lg border flex items-center justify-center font-display text-lg font-700 shrink-0",
                      gradeBg(scan.grade)
                    )}
                  >
                    {scan.grade}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg border border-obsidian-500 bg-obsidian-700 flex items-center justify-center shrink-0">
                    <span className="text-xs text-zinc-600">—</span>
                  </div>
                )}

                {/* Score */}
                <div className="w-16 text-right shrink-0">
                  {scan.score !== null ? (
                    <>
                      <span className={clsx("text-lg font-600", gradeColor(scan.grade))}>
                        {scan.score}
                      </span>
                      <span className="text-xs text-zinc-600">/100</span>
                    </>
                  ) : (
                    <span className="text-sm text-zinc-600">—</span>
                  )}
                </div>

                {/* Date */}
                <div className="w-28 text-right shrink-0">
                  <span className="text-xs text-zinc-500">
                    {formatRelative(scan.created_at)}
                  </span>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {showModal && <CreateScanModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
