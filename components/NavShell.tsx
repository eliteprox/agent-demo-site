"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { NAV } from "@/lib/constants";
import type { CurrentUser } from "@/lib/current-user";

export function NavShell({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Wordmark />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    active ? "bg-live-dim text-live-strong" : "text-muted hover:bg-elevated hover:text-fg"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg hover:bg-elevated"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-live-dim text-xs font-semibold text-live-strong">
                {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-[10rem] truncate sm:inline">{user.name || user.email}</span>
              <ChevronDown className="h-3.5 w-3.5 text-faint" strokeWidth={1.5} />
            </button>
            {menuOpen ? (
              <div
                className="absolute right-0 mt-1 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <p className="truncate px-3 py-2 text-xs text-faint">{user.email}</p>
                <Link
                  href="/billing"
                  className="block rounded-md px-3 py-2 text-sm text-fg hover:bg-elevated"
                  onClick={() => setMenuOpen(false)}
                >
                  Billing
                </Link>
                <a
                  href="/auth/logout"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-fg hover:bg-elevated"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} /> Sign out
                </a>
              </div>
            ) : null}
          </div>
        ) : (
          <a
            href={`/auth/login?returnTo=${encodeURIComponent(pathname)}`}
            className="rounded-md bg-live px-4 py-1.5 text-sm font-semibold text-white hover:bg-live-strong"
          >
            Sign in
          </a>
        )}
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-1.5 md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${
              pathname.startsWith(item.href) && (item.href !== "/" || pathname === "/")
                ? "bg-live-dim text-live-strong"
                : "text-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
