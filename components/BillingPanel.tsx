"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import {
  DEFAULT_TOP_UP_USD,
  formatTopUpUsdLabel,
  parseTopUpAmountUsd,
  sanitizeTopUpAmountInput,
  TOP_UP_MAX_USD,
  TOP_UP_MIN_USD,
} from "@/lib/top-up-amount";

type CreditBalance = {
  currency: string;
  live: string;
  pending: string;
  retrievedAt: string | null;
};

type AutoTopUp = {
  enabled: boolean;
  amountUsd: string | null;
};

type Invoice = {
  id: string;
  number?: string;
  status: string;
  currency: string;
  totalAmount: string;
  issuedAt?: string;
  periodEnd?: string;
  invoiceType?: string;
};

type PaymentMethod = {
  id: string;
  brand: string | null;
  last4: string | null;
  isDefault: boolean;
};

const QUICK_AMOUNTS = [5, 10, 25, 100] as const;
const AUTO_TOP_UP_AMOUNTS = [10, 25, 50, 100] as const;
const DEFAULT_AUTO_TOP_UP_AMOUNT = String(DEFAULT_TOP_UP_USD);

function normalizedAutoTopUpAmount(raw: string | null | undefined): string {
  const parsed = parseTopUpAmountUsd(raw ?? "");
  return parsed.ok ? formatTopUpUsdLabel(parsed.amount) : DEFAULT_AUTO_TOP_UP_AMOUNT;
}

function AmountQuickPick({
  inputId,
  label,
  placeholder,
  amounts,
  value,
  parsed,
  disabled,
  invalid,
  describedBy,
  onChange,
  onCommit,
  onEnter,
}: {
  inputId: string;
  label: string;
  placeholder: string;
  amounts: readonly number[];
  value: string;
  parsed: ReturnType<typeof parseTopUpAmountUsd>;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange: (next: string) => void;
  onCommit?: (next: string) => void;
  onEnter?: () => void;
}) {
  const selected = parsed.ok ? parsed.amount : null;
  return (
    <div className="flex flex-wrap items-end gap-2">
      {amounts.map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => {
            const next = String(n);
            onChange(next);
            onCommit?.(next);
          }}
          className={`rounded-md border px-3 py-1.5 font-mono text-xs tabular-nums ${
            selected === n
              ? "border-live bg-live-dim text-live-strong"
              : "border-border text-muted hover:border-border-strong hover:text-fg"
          }`}
        >
          ${n}
        </button>
      ))}
      <label htmlFor={inputId} className="relative inline-flex items-center">
        <span className="sr-only">{label}</span>
        <span aria-hidden="true" className="pointer-events-none absolute left-2.5 font-mono text-xs text-muted">
          $
        </span>
        <input
          id={inputId}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(sanitizeTopUpAmountInput(e.target.value))}
          onBlur={() => {
            if (parsed.ok) onCommit?.(value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
          className={`h-7.5 w-28 rounded-md border bg-white py-1.5 pl-6 pr-2 font-mono text-xs tabular-nums text-fg outline-none placeholder:text-faint focus-visible:ring-1 focus-visible:ring-live/30 ${
            invalid
              ? "border-billing-block"
              : parsed.ok && !amounts.some((n) => n === parsed.amount)
                ? "border-live bg-live-dim text-live-strong"
                : "border-border"
          }`}
        />
      </label>
    </div>
  );
}

function redirectToCheckout(url: string): void {
  const parsed = new URL(url);
  const ok =
    parsed.protocol === "https:" &&
    (parsed.hostname === "checkout.stripe.com" || parsed.hostname.endsWith(".stripe.com"));
  if (!ok) throw new Error("Checkout URL host is not allowed.");
  window.location.assign(parsed.toString());
}

function formatCreditUsd(amount: string, currency: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase() || "USD",
  }).format(n);
}

function formatInvoiceDate(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatInvoiceAmount(totalAmount: string, currency: string): string {
  const n = Number(totalAmount);
  if (!Number.isFinite(n)) return totalAmount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.toUpperCase() || "USD",
  }).format(n);
}

/**
 * Real billing surface for /billing (and reused, trimmed, on /usage): balance,
 * manual top-up, auto top-up, payment method, invoice history. Every fetch
 * hits the session-scoped /api/pymthouse/* routes — no externalUserId is ever
 * sent from the client, the server resolves it from the Auth0 session.
 */
export function BillingPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [autoTopUp, setAutoTopUp] = useState<AutoTopUp | null>(null);
  const [autoTopUpAmount, setAutoTopUpAmount] = useState(DEFAULT_AUTO_TOP_UP_AMOUNT);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [amountInput, setAmountInput] = useState(String(DEFAULT_TOP_UP_USD));
  const [busy, setBusy] = useState<"topup" | "pm" | "autotopup" | string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, invRes, pmRes] = await Promise.all([
        fetch("/api/pymthouse/wallet"),
        fetch("/api/pymthouse/wallet/invoices?pageSize=20"),
        fetch("/api/pymthouse/wallet/payment-methods"),
      ]);
      if (!walletRes.ok) {
        const body = (await walletRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed to load billing");
      }
      const wallet = (await walletRes.json()) as { credits: CreditBalance; autoTopUp?: AutoTopUp | null };
      setCredits(wallet.credits);
      const prefs = wallet.autoTopUp ?? null;
      setAutoTopUp(prefs);
      setAutoTopUpAmount(normalizedAutoTopUpAmount(prefs?.amountUsd));

      setInvoices(invRes.ok ? ((await invRes.json()) as { items?: Invoice[] }).items ?? [] : []);
      setPaymentMethods(
        pmRes.ok ? ((await pmRes.json()) as { paymentMethods?: PaymentMethod[] }).paymentMethods ?? [] : [],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("topup");
    if (!value) return;
    if (value === "succeeded") setFlash("Top-up succeeded. Balance will update shortly.");
    else if (value === "canceled") setFlash("Checkout canceled.");
    else if (value === "pm-saved") {
      setFlash("Payment method saved.");
      void fetch("/api/pymthouse/wallet/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ensureDefault: true }),
      }).finally(() => void load());
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("topup");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [load]);

  async function onTopUp() {
    const parsed = parseTopUpAmountUsd(amountInput);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setBusy("topup");
    setError(null);
    try {
      const res = await fetch("/api/pymthouse/top-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: parsed.amount }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Top-up failed");
      if (!data.url) throw new Error("No checkout URL returned");
      redirectToCheckout(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Top-up failed");
      setBusy(null);
    }
  }

  async function onSaveAutoTopUp(enabled: boolean, amountInputValue: string) {
    const parsed = parseTopUpAmountUsd(amountInputValue);
    let amount: number;
    if (parsed.ok) {
      amount = parsed.amount;
    } else if (!enabled) {
      const fallback = parseTopUpAmountUsd(autoTopUp?.amountUsd ?? DEFAULT_AUTO_TOP_UP_AMOUNT);
      amount = fallback.ok ? fallback.amount : DEFAULT_TOP_UP_USD;
    } else {
      setError(parsed.error);
      return;
    }
    setBusy("autotopup");
    setError(null);
    try {
      const res = await fetch("/api/pymthouse/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, amountUsd: amount }),
      });
      const data = (await res.json()) as { autoTopUp?: AutoTopUp; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save auto top-up");
      const prefs = data.autoTopUp ?? { enabled, amountUsd: amount.toFixed(2) };
      setAutoTopUp(prefs);
      setAutoTopUpAmount(normalizedAutoTopUpAmount(prefs.amountUsd));
      setFlash(
        prefs.enabled
          ? `Auto top-up on — adds $${prefs.amountUsd ?? amount} when credit hits $0.`
          : "Auto top-up off.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save auto top-up");
    } finally {
      setBusy(null);
    }
  }

  async function onAddCard() {
    setBusy("pm");
    setError(null);
    try {
      const res = await fetch("/api/pymthouse/wallet/payment-methods", { method: "POST" });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Payment method setup failed");
      if (!data.checkoutUrl) throw new Error("No checkout URL returned");
      redirectToCheckout(data.checkoutUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment method setup failed");
      setBusy(null);
    }
  }

  async function openInvoice(invoice: Invoice) {
    setBusy(invoice.id);
    setError(null);
    try {
      const res = await fetch(`/api/pymthouse/wallet/invoices/${encodeURIComponent(invoice.id)}/hosted-url`);
      const data = (await res.json()) as { hostedInvoiceUrl?: string | null; invoicePdf?: string | null; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not open invoice");
      const url = data.hostedInvoiceUrl || data.invoicePdf;
      if (!url) throw new Error("No hosted invoice URL");
      const parsed = new URL(url);
      const allowed =
        parsed.protocol === "https:" &&
        (parsed.hostname === "invoice.stripe.com" || parsed.hostname.endsWith(".stripe.com") || parsed.hostname === "pay.stripe.com");
      if (!allowed) throw new Error("Invoice URL host is not allowed");
      window.open(parsed.toString(), "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open invoice");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-border bg-surface p-5">
        <div className="h-4 w-32 rounded bg-elevated" />
        <div className="mt-4 h-16 rounded bg-elevated" />
      </div>
    );
  }

  const currency = credits?.currency ?? "USD";
  const liveNum = credits ? Number(credits.live) : 0;
  const hasCredit = Number.isFinite(liveNum) && liveNum > 0;
  const defaultPm = paymentMethods.find((pm) => pm.isDefault) ?? paymentMethods[0] ?? null;
  const parsedAmount = parseTopUpAmountUsd(amountInput);
  const parsedAutoTopUpAmount = parseTopUpAmountUsd(autoTopUpAmount);
  const amountLabel = parsedAmount.ok ? formatTopUpUsdLabel(parsedAmount.amount) : amountInput.trim() || "…";
  const amountInvalid = amountInput.trim() !== "" && !parsedAmount.ok;
  const amountDisabled = busy === "topup" || !parsedAmount.ok;
  const autoTopUpKnown = autoTopUp !== null;
  const autoTopUpBusy = busy === "autotopup" || !autoTopUpKnown;

  return (
    <div className="space-y-6">
      {flash ? (
        <p className="rounded-md border border-live/30 bg-live-dim px-3 py-2 text-sm text-live-strong">{flash}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-billing-block">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-border bg-surface p-5">
        {credits ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                  hasCredit ? "border-live/40 text-live-strong" : "border-billing-warn/40 text-billing-warn"
                }`}
              >
                {hasCredit ? "Credit available" : "No spendable credit"}
              </span>
            </div>
            <div className="mt-5">
              <p className="font-mono text-[10px] uppercase tracking-wide text-faint">Balance</p>
              <p className={`mt-1 font-mono text-3xl tabular-nums ${hasCredit ? "text-fg" : "text-billing-warn"}`}>
                {formatCreditUsd(credits.live, currency)}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Credit balance unavailable.</p>
        )}

        <div className="mt-5 space-y-3 border-t border-border pt-4">
          <AmountQuickPick
            inputId="topup-amount"
            label="Custom amount in dollars"
            placeholder="10.00"
            amounts={QUICK_AMOUNTS}
            value={amountInput}
            parsed={parsedAmount}
            invalid={amountInvalid}
            describedBy="topup-amount-hint"
            onChange={setAmountInput}
            onEnter={() => void onTopUp()}
          />
          <Button type="button" onClick={() => void onTopUp()} disabled={amountDisabled}>
            {busy === "topup" ? "Starting…" : `Add $${amountLabel} credit`}
          </Button>
        </div>
        <p id="topup-amount-hint" className={`mt-2 text-xs ${amountInvalid ? "text-billing-block" : "text-faint"}`}>
          {amountInvalid
            ? `Enter $${TOP_UP_MIN_USD}–$${TOP_UP_MAX_USD.toLocaleString()} (up to 2 decimals).`
            : `Min $${TOP_UP_MIN_USD} · max $${TOP_UP_MAX_USD.toLocaleString()}. Real Stripe Checkout via PymtHouse.`}
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-fg">Payment method</h3>
          <Button type="button" variant="secondary" onClick={() => void onAddCard()} disabled={busy === "pm"} className="!py-1.5 text-xs">
            {busy === "pm" ? "Starting…" : "Add card"}
          </Button>
        </div>
        {defaultPm ? (
          <p className="mt-2 font-mono text-sm text-muted">
            {(defaultPm.brand || "card").toUpperCase()} ···· {defaultPm.last4}
            {defaultPm.isDefault ? " · default" : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">No card on file.</p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h3 className="text-base font-semibold text-fg">Auto-reload</h3>
        <p className="mt-1 text-sm text-muted">
          When your balance reaches $0, charge your saved card and add credit automatically.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={autoTopUp?.enabled ?? false}
            disabled={autoTopUpBusy || (!defaultPm && !autoTopUp?.enabled)}
            onChange={(e) => {
              const next = e.target.checked;
              if (next && !defaultPm) {
                setError("Add a card before enabling auto-reload.");
                return;
              }
              void onSaveAutoTopUp(next, autoTopUpAmount);
            }}
          />
          Enable auto-reload
        </label>
        <div className="mt-3">
          <AmountQuickPick
            inputId="autotopup-amount"
            label="Auto-reload amount in dollars"
            placeholder="10.00"
            amounts={AUTO_TOP_UP_AMOUNTS}
            value={autoTopUpAmount}
            parsed={parsedAutoTopUpAmount}
            disabled={autoTopUpBusy}
            onChange={setAutoTopUpAmount}
            onCommit={autoTopUp?.enabled && defaultPm ? (next) => void onSaveAutoTopUp(true, next) : undefined}
          />
        </div>
        <p className="mt-2 text-xs text-faint">
          {!autoTopUpKnown
            ? "Auto-reload settings unavailable. Refresh to try again."
            : defaultPm
              ? `Reloads $${parsedAutoTopUpAmount.ok ? formatTopUpUsdLabel(parsedAutoTopUpAmount.amount) : "…"} when balance hits $0.`
              : "Add a card to enable auto-reload."}
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-fg">Billing history</h3>
        {invoices.length > 0 ? (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {invoices.slice(0, 20).map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-fg">{inv.number ?? inv.id}</p>
                  <p className="text-xs text-faint">
                    {formatInvoiceDate(inv.issuedAt ?? inv.periodEnd)}
                    {inv.status ? ` · ${inv.status}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-fg">{formatInvoiceAmount(inv.totalAmount, inv.currency)}</span>
                  <button
                    type="button"
                    onClick={() => void openInvoice(inv)}
                    disabled={busy === inv.id}
                    className="text-xs text-cool hover:underline disabled:opacity-50"
                  >
                    {busy === inv.id ? "…" : "Download"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No billing activity yet.</p>
        )}
      </section>

      <button type="button" onClick={() => void load()} className="text-xs text-faint hover:text-muted">
        Refresh billing
      </button>
    </div>
  );
}
