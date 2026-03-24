"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";

const nav = [
  {
    label: "Overview",
    href: "/overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="9" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="2" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="9" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    label: "Scanner",
    href: "/scanner",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <circle cx="13.5" cy="2.5" r="1.5" fill="currentColor" className="text-violet"/>
      </svg>
    ),
  },
  {
    label: "Shield",
    href: "/shield",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L2.5 4v4c0 3 2.5 5.5 5.5 6 3-0.5 5.5-3 5.5-6V4L8 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col bg-obsidian-900 border-r border-obsidian-600"
      style={{ boxShadow: "inset -1px 0 0 #22222f" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-obsidian-600">
        <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
          <path d="M14 3C8.48 3 4 7.48 4 13v10l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5V13c0-5.52-4.48-10-10-10z" fill="#7c3aed" opacity="0.9"/>
          <circle cx="10" cy="13" r="1.5" fill="#0d0d12"/>
          <circle cx="18" cy="13" r="1.5" fill="#0d0d12"/>
        </svg>
        <span className="font-display text-sm font-600 text-zinc-100 tracking-tight">
          Spectre<span className="text-violet"> Security</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100",
                active
                  ? "bg-violet/10 text-violet border border-violet/20 shadow-violet-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-obsidian-700"
              )}
            >
              <span className={active ? "text-violet" : "text-zinc-600"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pb-4 pt-2 border-t border-obsidian-600">
        <span className="font-mono text-[10px] text-zinc-600">v0.1.0-mvp</span>
      </div>
    </aside>
  );
}


export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 h-12 bg-obsidian-900 border-b border-obsidian-600">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <path d="M14 3C8.48 3 4 7.48 4 13v10l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 3 2.5V13c0-5.52-4.48-10-10-10z" fill="#7c3aed" opacity="0.9"/>
            <circle cx="10" cy="13" r="1.5" fill="#0d0d12"/>
            <circle cx="18" cy="13" r="1.5" fill="#0d0d12"/>
          </svg>
          <span className="font-display text-xs font-600 text-zinc-100 tracking-tight">
            Spectre<span className="text-violet"> Security</span>
          </span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-1 text-zinc-400 hover:text-zinc-200"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
      {open && (
        <div className="bg-obsidian-900 border-b border-obsidian-600 px-3 py-2 space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100",
                  active
                    ? "bg-violet/10 text-violet border border-violet/20"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-obsidian-700"
                )}
              >
                <span className={active ? "text-violet" : "text-zinc-600"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
