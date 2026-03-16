"use client";

import { usePathname, useRouter } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/scanner": "Scanner",
  "/shield": "Shield",
  "/shield/violations": "Violation log",
  "/settings": "Settings",
};

function getTitle(pathname: string): string {
  // Scan detail pages
  if (pathname.match(/^\/scanner\/[^/]+$/)) return "Scan detail";
  return PAGE_TITLES[pathname] ?? "Spectre Security";
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getTitle(pathname);

  function handleSignOut() {
    document.cookie = "spectre_api_key=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-obsidian-900 border-b border-obsidian-600 shrink-0">
      <h1 className="font-display text-sm font-600 text-zinc-300 tracking-wide">
        {title}
      </h1>
      <button
        onClick={handleSignOut}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M5.5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.5M9.5 9.5l2.5-2.5-2.5-2.5M12 7H5.5"
            stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        Sign out
      </button>
    </header>
  );
}
