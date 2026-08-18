import Link from "next/link";
import { SITE } from "@/lib/constants";

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className="shrink-0">
      <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--color-live-dim)" />
      <path
        d="M11 21V11l10 5-10 5Z"
        fill="var(--color-live)"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-base font-semibold tracking-tight text-fg">{SITE.name}</span>
    </Link>
  );
}
