import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api/client";

// ── Scans ──────────────────────────────────────────────────────────────────

export function useScans() {
  return useQuery({
    queryKey: ["scans"],
    queryFn: () => api.listScans(),
  });
}

export function useScanDetail(id: string) {
  return useQuery({
    queryKey: ["scan", id],
    queryFn: () => api.getScan(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll every 3 seconds while scan is active
      return status === "pending" || status === "running" ? 3000 : false;
    },
    enabled: !!id,
  });
}

export function useCreateScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createScan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scans"] }),
  });
}

export function useDeleteScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteScan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scans"] }),
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.generateReport,
    onSuccess: (_data, scanId) => {
      qc.invalidateQueries({ queryKey: ["scan", scanId] });
    },
  });
}

// ── Policies ───────────────────────────────────────────────────────────────

export function usePolicies() {
  return useQuery({
    queryKey: ["policies"],
    queryFn: () => api.listPolicies(),
  });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createPolicy,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
}

export function useUpdatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updatePolicy>[1] }) =>
      api.updatePolicy(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
}

export function useDeletePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deletePolicy,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
}

// ── Violations ─────────────────────────────────────────────────────────────

export function useViolations(params?: Parameters<typeof api.listViolations>[0]) {
  return useQuery({
    queryKey: ["violations", params],
    queryFn: () => api.listViolations(params),
  });
}

// ── API Keys ───────────────────────────────────────────────────────────────

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: api.listApiKeys,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createApiKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.revokeApiKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}
