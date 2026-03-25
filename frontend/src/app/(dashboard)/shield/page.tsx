"use client";

import { useState } from "react";
import { usePolicies, useCreatePolicy, useUpdatePolicy, useDeletePolicy } from "@/lib/hooks";
import { Badge, Button, Card, Spinner, Toggle, EmptyState } from "@/components/ui";
import { formatRelative } from "@/lib/utils/format";
import { clsx } from "clsx";
import type { PolicyCreate } from "@/lib/api/client";

// ── Policy form modal ──────────────────────────────────────────────────────

const RULE_TYPE_INFO = {
  regex: {
    label: "Regex pattern",
    hint: "Match text using a regular expression (e.g. \\b\\d{3}-\\d{2}-\\d{4}\\b for SSNs)",
    fields: ["pattern"],
  },
  ner: {
    label: "Named entity recognition",
    hint: "Detect entities using AI: PERSON, ORG, GPE, LOC",
    fields: ["entity_types"],
  },
  keyword: {
    label: "Keyword blocklist",
    hint: "Match specific words or phrases (comma-separated)",
    fields: ["terms"],
  },
};

function PolicyFormModal({ onClose }: { onClose: () => void }) {
  const createPolicy = useCreatePolicy();
  const [ruleType, setRuleType] = useState<"regex" | "ner" | "keyword">("regex");
  const [form, setForm] = useState({
    name: "",
    description: "",
    action: "alert" as "block" | "redact" | "alert",
    applies_to: "both" as "input" | "output" | "both",
    // Rule-specific
    pattern: "",
    entity_types: "PERSON,ORG,GPE",
    terms: "",
  });

  function buildRuleConfig(): Record<string, unknown> {
    if (ruleType === "regex") return { pattern: form.pattern };
    if (ruleType === "ner")
      return { entity_types: form.entity_types.split(",").map((s) => s.trim().toUpperCase()) };
    return {
      terms: form.terms.split(",").map((s) => s.trim()).filter(Boolean),
      use_fuzzy: false,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: PolicyCreate = {
      name: form.name,
      description: form.description || undefined,
      rule_type: ruleType,
      rule_config: buildRuleConfig(),
      action: form.action,
      applies_to: form.applies_to,
    };
    try {
      await createPolicy.mutateAsync(data);
      onClose();
    } catch {}
  }

  const info = RULE_TYPE_INFO[ruleType];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,6,8,0.85)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-[#0d0d11] border border-[#1a1a1f] rounded-xl w-full max-w-lg shadow-lg animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1f] sticky top-0 bg-[#0d0d11]">
          <h2 className="font-display text-sm font-600 text-[#f0f0f2]">New DLP policy</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Policy name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Block credit card numbers"
              className="w-full bg-[#0d0d11] border border-[#1a1a1f] rounded-lg px-3 py-2 text-sm text-[#f0f0f2] placeholder-zinc-600 outline-none"
            />
          </div>

          {/* Rule type selector */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Detection method</label>
            <div className="grid grid-cols-3 gap-2">
              {(["regex", "ner", "keyword"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRuleType(t)}
                  className={clsx(
                    "px-3 py-2 rounded-lg text-xs border transition-all",
                    ruleType === t
                      ? "bg-[rgba(110,242,255,0.08)] text-[#6ef2ff] border-[rgba(110,242,255,0.2)]"
                      : "bg-[#0d0d11] text-zinc-400 border-[#1a1a1f] hover:text-zinc-200"
                  )}
                >
                  {RULE_TYPE_INFO[t].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-2">{info.hint}</p>
          </div>

          {/* Rule-specific fields */}
          {ruleType === "regex" && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Pattern *</label>
              <input
                required
                value={form.pattern}
                onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
                placeholder="\b\d{3}-\d{2}-\d{4}\b"
                className="w-full bg-[#0d0d11] border border-[#1a1a1f] rounded-lg px-3 py-2 text-sm text-[#f0f0f2] placeholder-zinc-600 font-mono outline-none"
              />
            </div>
          )}

          {ruleType === "ner" && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Entity types</label>
              <input
                value={form.entity_types}
                onChange={(e) => setForm((f) => ({ ...f, entity_types: e.target.value }))}
                placeholder="PERSON,ORG,GPE,LOC"
                className="w-full bg-[#0d0d11] border border-[#1a1a1f] rounded-lg px-3 py-2 text-sm text-[#f0f0f2] placeholder-zinc-600 font-mono outline-none"
              />
            </div>
          )}

          {ruleType === "keyword" && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Terms (comma-separated)</label>
              <textarea
                value={form.terms}
                onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
                placeholder="PROJECT FALCON, Operation Bluebird, CONFIDENTIAL"
                rows={3}
                className="w-full bg-[#0d0d11] border border-[#1a1a1f] rounded-lg px-3 py-2 text-sm text-[#f0f0f2] placeholder-zinc-600 outline-none resize-none"
              />
            </div>
          )}

          {/* Action */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Action</label>
              <select
                value={form.action}
                onChange={(e) => setForm((f) => ({ ...f, action: e.target.value as any }))}
                className="w-full bg-[#0d0d11] border border-[#1a1a1f] rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
              >
                <option value="alert">Alert (log only)</option>
                <option value="redact">Redact (replace with [REDACTED])</option>
                <option value="block">Block (return 403)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Applies to</label>
              <select
                value={form.applies_to}
                onChange={(e) => setForm((f) => ({ ...f, applies_to: e.target.value as any }))}
                className="w-full bg-[#0d0d11] border border-[#1a1a1f] rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
              >
                <option value="both">Input and output</option>
                <option value="input">Input only</option>
                <option value="output">Output only</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createPolicy.isPending || !form.name}
              className="flex-1"
            >
              {createPolicy.isPending ? <Spinner className="w-3.5 h-3.5" /> : null}
              {createPolicy.isPending ? "Creating…" : "Create policy"}
            </Button>
          </div>

          {createPolicy.isError && (
            <p className="text-xs text-red-400">Failed to create policy. Check your inputs.</p>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Policy row ─────────────────────────────────────────────────────────────

function PolicyRow({ policy }: { policy: any }) {
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

  function toggleActive() {
    updatePolicy.mutate({ id: policy.id, data: { is_active: !policy.is_active } });
  }

  function handleDelete() {
    if (!confirm(`Delete policy "${policy.name}"?`)) return;
    deletePolicy.mutate(policy.id);
  }

  return (
    <tr className="border-b border-[#1a1a1f] hover:bg-[#0d0d11]/30 transition-colors">
      <td className="px-4 py-3.5">
        <p className="text-sm font-500 text-zinc-200">{policy.name}</p>
        {policy.description && (
          <p className="text-xs text-zinc-500 mt-0.5">{policy.description}</p>
        )}
      </td>
      <td className="px-4 py-3.5">
        <Badge variant="default" className="font-mono text-[10px]">{policy.rule_type}</Badge>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={policy.action}>{policy.action}</Badge>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs text-zinc-500 capitalize">
          {policy.applies_to === "both" ? "Input + output" : policy.applies_to}
        </span>
      </td>
      <td className="px-4 py-3.5 text-xs text-zinc-500">{formatRelative(policy.created_at)}</td>
      <td className="px-4 py-3.5">
        <Toggle
          checked={policy.is_active}
          onChange={toggleActive}
          disabled={updatePolicy.isPending}
        />
      </td>
      <td className="px-4 py-3.5 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={policy.is_builtin || deletePolicy.isPending}
          className="text-red-500 hover:text-red-400"
        >
          Delete
        </Button>
      </td>
    </tr>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ShieldPage() {
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading } = usePolicies();
  const policies = data?.policies ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-600 text-[#f0f0f2]">DLP policies</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {policies.filter((p: any) => p.is_active).length} active of {policies.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/shield/violations"}
          >
            View violations
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New policy
          </Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>
        ) : policies.length === 0 ? (
          <EmptyState
            title="No policies yet"
            description="Create a policy to start inspecting LLM traffic for sensitive data."
            action={
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Create your first policy
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a1a1f]">
                  {["Policy", "Type", "Action", "Applies to", "Created", "Active", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] text-zinc-500 uppercase tracking-wide font-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.map((p: any) => <PolicyRow key={p.id} policy={p} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && <PolicyFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
