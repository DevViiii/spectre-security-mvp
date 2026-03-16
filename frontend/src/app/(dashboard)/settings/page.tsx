"use client";

import { useState } from "react";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/lib/hooks";
import { Button, Card, Spinner } from "@/components/ui";
import { formatDate } from "@/lib/utils/format";
import { clsx } from "clsx";

// ── New key created callout ────────────────────────────────────────────────

function NewKeyCallout({ rawKey, onDismiss }: { rawKey: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyKey() {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-green-950/30 border border-green-900/50 rounded-xl p-4 animate-slide-up">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-500 text-green-400 mb-0.5">API key created</p>
          <p className="text-xs text-zinc-500">
            Copy this key now — it will not be shown again.
          </p>
        </div>
        <button onClick={onDismiss} className="text-zinc-500 hover:text-zinc-300 shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-obsidian-800 border border-obsidian-600 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 truncate">
          {rawKey}
        </code>
        <Button variant="secondary" size="sm" onClick={copyKey}>
          {copied ? (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 7l3 3 6-6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
              <path d="M8.5 4.5V2.5a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.25" />
            </svg>
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

// ── API key row ────────────────────────────────────────────────────────────

function ApiKeyRow({ apiKey }: { apiKey: any }) {
  const revokeApiKey = useRevokeApiKey();
  const [confirming, setConfirming] = useState(false);

  async function handleRevoke() {
    if (!confirming) { setConfirming(true); return; }
    await revokeApiKey.mutateAsync(apiKey.id);
    setConfirming(false);
  }

  return (
    <tr className="border-b border-obsidian-700">
      <td className="px-4 py-3.5">
        <p className="text-sm font-500 text-zinc-200">{apiKey.name}</p>
      </td>
      <td className="px-4 py-3.5 font-mono text-xs text-zinc-500">
        {apiKey.key_prefix}••••••••
      </td>
      <td className="px-4 py-3.5 text-xs text-zinc-500">
        {formatDate(apiKey.created_at)}
      </td>
      <td className="px-4 py-3.5 text-xs text-zinc-500">
        {apiKey.last_used_at ? formatDate(apiKey.last_used_at) : "Never"}
      </td>
      <td className="px-4 py-3.5 text-right">
        <Button
          variant={confirming ? "danger" : "ghost"}
          size="sm"
          onClick={handleRevoke}
          disabled={revokeApiKey.isPending}
        >
          {revokeApiKey.isPending ? <Spinner className="w-3 h-3" /> : null}
          {confirming ? "Confirm revoke" : "Revoke"}
        </Button>
        {confirming && (
          <button
            onClick={() => setConfirming(false)}
            className="ml-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Cancel
          </button>
        )}
      </td>
    </tr>
  );
}

// ── New key form ───────────────────────────────────────────────────────────

function CreateKeyForm({ onCreated }: { onCreated: (key: string) => void }) {
  const createApiKey = useCreateApiKey();
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const data = await createApiKey.mutateAsync(name.trim());
    onCreated(data.key);
    setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Key name (e.g. CI pipeline)"
        className="flex-1 bg-obsidian-800 border border-obsidian-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus-violet"
      />
      <Button
        variant="primary"
        type="submit"
        disabled={!name.trim() || createApiKey.isPending}
      >
        {createApiKey.isPending ? <Spinner className="w-3.5 h-3.5" /> : null}
        Create key
      </Button>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data, isLoading } = useApiKeys();
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);

  const keys = data?.keys ?? [];

  function handleWebhookSave() {
    // In a real implementation, this would POST to a settings endpoint
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* API Keys section */}
      <div>
        <h2 className="font-display text-lg font-600 text-zinc-100 mb-1">API keys</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Keys grant full API access. Treat them like passwords — never commit to source control.
        </p>

        {newRawKey && (
          <div className="mb-4">
            <NewKeyCallout rawKey={newRawKey} onDismiss={() => setNewRawKey(null)} />
          </div>
        )}

        <Card className="mb-4">
          <div className="p-4 border-b border-obsidian-600">
            <CreateKeyForm onCreated={(key) => setNewRawKey(key)} />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No active keys.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-obsidian-700">
                    {["Name", "Key", "Created", "Last used", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] text-zinc-500 uppercase tracking-wide font-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k: any) => <ApiKeyRow key={k.id} apiKey={k} />)}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Webhook section */}
      <div>
        <h2 className="font-display text-base font-600 text-zinc-100 mb-1">Shield webhook</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Receive a POST request on every Shield violation. Useful for Slack or PagerDuty alerts.
        </p>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="flex-1 bg-obsidian-800 border border-obsidian-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus-violet font-mono"
            />
            <Button
              variant="secondary"
              onClick={handleWebhookSave}
              disabled={!webhookUrl.trim()}
            >
              {webhookSaved ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 7l3 3 6-6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
              {webhookSaved ? "Saved" : "Save"}
            </Button>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Payload: <code className="font-mono">{"{policy_name, action, direction, matched_pattern, timestamp}"}</code>
          </p>
        </Card>
      </div>

      {/* Version info */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-600 text-zinc-300 mb-3">Platform info</h3>
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          {[
            ["Version", "0.1.0-mvp"],
            ["Environment", process.env.NEXT_PUBLIC_API_URL?.includes("localhost") ? "development" : "production"],
            ["API endpoint", process.env.NEXT_PUBLIC_API_URL ?? "—"],
            ["Dashboard", "Spectre Security v0.1"],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="text-zinc-500">{label}: </span>
              <span className="text-zinc-300 font-mono">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
