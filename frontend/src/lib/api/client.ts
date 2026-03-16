import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

// ── Client factory ─────────────────────────────────────────────────────────

function getApiKey(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/spectre_api_key=([^;]+)/);
  return match ? match[1] : "";
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const key = getApiKey();
  if (key) config.headers["X-Api-Key"] = key;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      document.cookie = "spectre_api_key=; path=/; max-age=0";
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Scan API ───────────────────────────────────────────────────────────────

export interface ScanCreate {
  name?: string;
  target_url: string;
  target_api_key?: string;
  attack_suite: "full" | "quick" | "injection_only" | "jailbreak_only";
}

export async function createScan(data: ScanCreate) {
  const res = await apiClient.post("/scans", data);
  return res.data.data;
}

export async function listScans(cursor?: string) {
  const res = await apiClient.get("/scans", { params: { limit: 20, cursor } });
  return res.data.data;
}

export async function getScan(id: string) {
  const res = await apiClient.get(`/scans/${id}`);
  return res.data.data;
}

export async function deleteScan(id: string) {
  await apiClient.delete(`/scans/${id}`);
}

export async function generateReport(scanId: string) {
  const res = await apiClient.post(`/reports/${scanId}/generate`);
  return res.data.data;
}

// ── Shield API ─────────────────────────────────────────────────────────────

export interface PolicyCreate {
  name: string;
  description?: string;
  rule_type: "regex" | "ner" | "keyword";
  rule_config: Record<string, unknown>;
  action: "block" | "redact" | "alert";
  applies_to: "input" | "output" | "both";
}

export async function listPolicies(activeOnly = false) {
  const res = await apiClient.get("/shield/policies", {
    params: { active_only: activeOnly },
  });
  return res.data.data;
}

export async function createPolicy(data: PolicyCreate) {
  const res = await apiClient.post("/shield/policies", data);
  return res.data.data;
}

export async function updatePolicy(
  id: string,
  data: Partial<PolicyCreate> & { is_active?: boolean }
) {
  const res = await apiClient.patch(`/shield/policies/${id}`, data);
  return res.data.data;
}

export async function deletePolicy(id: string) {
  await apiClient.delete(`/shield/policies/${id}`);
}

export async function listViolations(params?: {
  policy_id?: string;
  limit?: number;
  cursor?: string;
}) {
  const res = await apiClient.get("/shield/violations", { params });
  return res.data.data;
}

// ── Auth API ───────────────────────────────────────────────────────────────

export async function listApiKeys() {
  const res = await apiClient.get("/auth");
  return res.data.data;
}

export async function createApiKey(name: string) {
  const res = await apiClient.post("/auth", { name });
  return res.data.data;
}

export async function revokeApiKey(id: string) {
  await apiClient.delete(`/auth/${id}`);
}
