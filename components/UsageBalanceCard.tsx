"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";

type Wallet = {
  credits: { currency: string; live: string };
  autoTopUp?: { enabled: boolean; amountUsd: string | null } | null;
};

function formatUsd(amount: string, currency: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() || "USD" }).format(n);
}

/** Glanceable balance summary for /usage — full management lives on /billing. */
export function UsageBalanceCard() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/pymthouse/wallet")
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || "Failed to load balance");
        }
        return (await r.json()) as Wallet;
      })
      .then((data) => {
        if (!cancelled) setWallet(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load balance");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const live = wallet ? Number(wallet.credits.live) : null;
  const zero = live != null && live <= 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      {error ? (
        <p role="alert" className="text-sm text-billing-block">
          {error}
        </p>
      ) : (
        <>
          <p className="font-mono text-[10px] uppercase tracking-wide text-faint">Current balance</p>
          <p className={`mt-1 font-mono text-4xl tabular-nums ${zero ? "text-billing-warn" : "text-fg"}`}>
            {wallet ? formatUsd(wallet.credits.live, wallet.credits.currency) : "…"}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button href="/billing">Add funds</Button>
            <span className="text-sm text-muted">
              Auto-reload{" "}
              <span className={wallet?.autoTopUp?.enabled ? "text-live-strong" : "text-faint"}>
                {wallet?.autoTopUp?.enabled ? `On · $${wallet.autoTopUp.amountUsd ?? ""}` : "Off"}
              </span>
            </span>
          </div>
          {zero ? (
            <p className="mt-3 text-xs text-billing-warn">
              When your balance reaches $0, new requests will stop until you add funds.
            </p>
          ) : null}
        </>
      )}
      <div className="mt-6 grid grid-cols-2 gap-2 border-t border-border pt-4 text-sm sm:grid-cols-4">
        <Link href="/billing" className="text-cool hover:underline">
          Payment methods
        </Link>
        <Link href="/billing" className="text-cool hover:underline">
          Billing history
        </Link>
        <Link href="/api" className="text-cool hover:underline">
          Usage limits
        </Link>
        <Link href="/playbooks" className="text-cool hover:underline">
          Pricing
        </Link>
      </div>
    </div>
  );
}
