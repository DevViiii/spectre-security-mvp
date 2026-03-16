import { formatDistanceToNow, format } from "date-fns";

export function formatDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy HH:mm");
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function truncate(str: string, len: number): string {
  return str.length <= len ? str : str.slice(0, len) + "…";
}

export function gradeColor(grade: string | null): string {
  const map: Record<string, string> = {
    A: "text-green-400",
    B: "text-lime-400",
    C: "text-amber-400",
    D: "text-orange-400",
    F: "text-red-400",
  };
  return map[grade ?? "F"] ?? "text-zinc-500";
}

export function gradeBg(grade: string | null): string {
  const map: Record<string, string> = {
    A: "bg-green-950/60 border-green-900/60 text-green-400",
    B: "bg-lime-950/60 border-lime-900/60 text-lime-400",
    C: "bg-amber-950/60 border-amber-900/60 text-amber-400",
    D: "bg-orange-950/60 border-orange-900/60 text-orange-400",
    F: "bg-red-950/60 border-red-900/60 text-red-400",
  };
  return map[grade ?? "F"] ?? "bg-zinc-800/60 border-zinc-700 text-zinc-400";
}

export function scoreLabel(score: number | null): string {
  if (score === null) return "—";
  return score.toString();
}
