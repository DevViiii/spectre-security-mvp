"use client";

import { clsx } from "clsx";
import React from "react";

// ── Badge ──────────────────────────────────────────────────────────────────

type BadgeVariant =
  | "critical" | "high" | "medium" | "low"  // severity
  | "pending" | "running" | "completed" | "failed"  // scan status
  | "block" | "redact" | "alert"  // shield action
  | "passed" | "error"  // finding status
  | "default";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  critical: "bg-red-950/60 text-red-400 border-red-900/60",
  high:     "bg-orange-950/60 text-orange-400 border-orange-900/60",
  medium:   "bg-amber-950/60 text-amber-400 border-amber-900/60",
  low:      "bg-green-950/60 text-green-400 border-green-900/60",
  pending:  "bg-zinc-800/60 text-zinc-400 border-zinc-700/60",
  running:  "bg-violet/10 text-violet-glow border-violet/30",
  completed:"bg-green-950/60 text-green-400 border-green-900/60",
  failed:   "bg-red-950/60 text-red-400 border-red-900/60",
  block:    "bg-red-950/60 text-red-400 border-red-900/60",
  redact:   "bg-amber-950/60 text-amber-400 border-amber-900/60",
  alert:    "bg-blue-950/60 text-blue-400 border-blue-900/60",
  passed:   "bg-green-950/60 text-green-400 border-green-900/60",
  error:    "bg-zinc-800/60 text-zinc-500 border-zinc-700/60",
  default:  "bg-obsidian-600/60 text-zinc-400 border-obsidian-500/60",
};

export function Badge({
  variant = "default",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-500 border tracking-wide uppercase",
        BADGE_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:   "bg-violet hover:bg-violet-dim text-white border-transparent",
  secondary: "bg-obsidian-700 hover:bg-obsidian-600 text-zinc-300 border-obsidian-500",
  ghost:     "bg-transparent hover:bg-obsidian-700 text-zinc-400 hover:text-zinc-200 border-transparent",
  danger:    "bg-red-950/60 hover:bg-red-950 text-red-400 border-red-900/60",
};

export function Button({
  variant = "secondary",
  size = "md",
  disabled,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border font-500 transition-all duration-100 focus-violet disabled:opacity-40 disabled:cursor-not-allowed",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm",
        BUTTON_STYLES[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "bg-obsidian-900 border border-obsidian-600 rounded-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx("animate-spin", className ?? "w-4 h-4 text-violet")}
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 focus-violet disabled:opacity-40",
        checked ? "bg-violet" : "bg-obsidian-500"
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-obsidian-700 border border-obsidian-500 flex items-center justify-center mb-4 text-zinc-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-500 text-zinc-300 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-zinc-600 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
