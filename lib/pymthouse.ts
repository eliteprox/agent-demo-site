import "server-only";

import {
  PmtHouseClient,
  PmtHouseError,
  type AppUserInvoice,
  type AppUserInvoiceHostedUrlResult,
  type AppUserPaymentMethod,
} from "@pymthouse/builder-sdk";

/**
 * Server-only PymtHouse Builder API client — same shape as ComfyPeer's
 * lib/pymthouse.ts. Ported routes: account provisioning, credit balance,
 * auto top-up, invoices, payment methods, wallet top-up, API key mint.
 * Not ported: mintOwnerSignerSession / orchestrator discovery / synthetic
 * test-usage ingest — this app has no live-orchestrator or usage-simulation
 * surface, it's a billing console.
 */

function readPymthouseM2mConfig() {
  const issuerUrl = process.env.PYMTHOUSE_ISSUER_URL?.trim();
  const m2mClientId = process.env.PYMTHOUSE_M2M_CLIENT_ID?.trim();
  const m2mClientSecret = process.env.PYMTHOUSE_M2M_CLIENT_SECRET?.trim();
  if (!issuerUrl || !m2mClientId || !m2mClientSecret) {
    return null;
  }
  return {
    issuerUrl,
    m2mClientId,
    m2mClientSecret,
    allowInsecureHttp: process.env.PYMTHOUSE_ALLOW_INSECURE_HTTP === "1",
  };
}

export function readPublicClientId(): string {
  const id = process.env.PYMTHOUSE_PUBLIC_CLIENT_ID?.trim();
  if (!id) {
    throw new PmtHouseError("PYMTHOUSE_PUBLIC_CLIENT_ID is required", {
      status: 503,
      code: "pymthouse_required",
    });
  }
  return id;
}

export function createPmtHouseClient(): PmtHouseClient {
  const config = readPymthouseM2mConfig();
  if (!config) {
    throw new PmtHouseError(
      "Pymthouse is not configured. Set PYMTHOUSE_ISSUER_URL, PYMTHOUSE_M2M_CLIENT_ID, and PYMTHOUSE_M2M_CLIENT_SECRET.",
      { status: 503, code: "pymthouse_required" },
    );
  }
  return new PmtHouseClient({
    issuerUrl: config.issuerUrl,
    publicClientId: readPublicClientId(),
    m2mClientId: config.m2mClientId,
    m2mClientSecret: config.m2mClientSecret,
    allowInsecureHttp: config.allowInsecureHttp,
  });
}

function appsOrigin(): string {
  const issuer = process.env.PYMTHOUSE_ISSUER_URL?.trim();
  if (!issuer) {
    throw new PmtHouseError("PYMTHOUSE_ISSUER_URL is required", {
      status: 503,
      code: "pymthouse_required",
    });
  }
  return issuer.replace(/\/api\/v1\/oidc\/?$/i, "");
}

function m2mAuthHeader(): string {
  const id = process.env.PYMTHOUSE_M2M_CLIENT_ID?.trim();
  const secret = process.env.PYMTHOUSE_M2M_CLIENT_SECRET?.trim();
  if (!id || !secret) {
    throw new PmtHouseError("M2M credentials required", {
      status: 503,
      code: "pymthouse_required",
    });
  }
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

export function isUserNotFoundError(error: unknown): boolean {
  if (!(error instanceof PmtHouseError)) return false;
  return error.status === 404 || error.code === "user_not_found" || error.code === "not_found";
}

export async function ensureAppUserProvisioned(
  externalUserId: string,
  email?: string,
): Promise<void> {
  const client = createPmtHouseClient();
  try {
    await client.upsertAppUser({
      externalUserId,
      ...(email?.trim() ? { email: email.trim() } : {}),
      status: "active",
    });
  } catch (error) {
    if (error instanceof PmtHouseError && error.status === 409) return;
    throw error;
  }
}

export async function createUserApiKey(externalUserId: string, label?: string) {
  await ensureAppUserProvisioned(externalUserId);
  // Key mint is not wrapped by builder-sdk yet — one M2M POST (same as ComfyPeer).
  const clientId = readPublicClientId();
  const response = await fetch(
    `${appsOrigin()}/api/v1/apps/${encodeURIComponent(clientId)}/users/${encodeURIComponent(externalUserId)}/keys`,
    {
      method: "POST",
      headers: {
        Authorization: m2mAuthHeader(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(label ? { label } : {}),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new PmtHouseError(text || "API key create failed", {
      status: response.status,
      code: "api_key_create_failed",
    });
  }
  return (await response.json()) as {
    apiKey: string;
    sdkToken?: string;
    id: string;
  };
}

export type UserCreditBalance = {
  externalUserId: string;
  customerId: string;
  currency: string;
  live: string;
  pending: string;
  settled: string;
  retrievedAt: string | null;
};

/** Konnect GET /credits/balance for this end user. Use `live` to gate spend. */
export async function loadUserCreditBalance(externalUserId: string): Promise<UserCreditBalance> {
  await ensureAppUserProvisioned(externalUserId);
  const clientId = readPublicClientId();
  const response = await fetch(
    `${appsOrigin()}/api/v1/apps/${encodeURIComponent(clientId)}/users/${encodeURIComponent(externalUserId)}/allowances`,
    {
      method: "GET",
      headers: {
        Authorization: m2mAuthHeader(),
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new PmtHouseError(text || "Failed to load credit balance", {
      status: response.status,
      code: "credit_balance_failed",
    });
  }
  return (await response.json()) as UserCreditBalance;
}

export type WalletAutoTopUp = {
  enabled: boolean;
  amountUsd: string | null;
};

function merchantWalletUrl(externalUserId?: string): URL {
  const clientId = readPublicClientId();
  const url = new URL(`${appsOrigin()}/api/v1/apps/${encodeURIComponent(clientId)}/billing/wallet`);
  if (externalUserId) {
    url.searchParams.set("externalUserId", externalUserId);
  }
  return url;
}

async function merchantWalletRequest(
  url: URL,
  init: RequestInit,
  fallbackMessage: string,
  fallbackCode: string,
): Promise<Response> {
  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: m2mAuthHeader(),
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (response.ok) return response;
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  };
  throw new PmtHouseError(body.error || fallbackMessage, {
    status: response.status,
    code: body.code || fallbackCode,
  });
}

/** Merchant wallet auto-top-up prefs from GET …/billing/wallet. */
export async function loadWalletAutoTopUp(externalUserId: string): Promise<WalletAutoTopUp> {
  const response = await merchantWalletRequest(
    merchantWalletUrl(externalUserId),
    { method: "GET" },
    "Failed to load auto top-up",
    "auto_topup_load_failed",
  );
  const body = (await response.json()) as { autoTopUp?: WalletAutoTopUp | null };
  return body.autoTopUp ?? { enabled: false, amountUsd: null };
}

export async function saveWalletAutoTopUp(input: {
  externalUserId: string;
  enabled: boolean;
  amountUsd: string;
}): Promise<WalletAutoTopUp> {
  const response = await merchantWalletRequest(
    merchantWalletUrl(),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        externalUserId: input.externalUserId,
        enabled: input.enabled,
        amountUsd: input.amountUsd,
      }),
    },
    "Failed to save auto top-up",
    "auto_topup_save_failed",
  );
  const body = (await response.json()) as { autoTopUp?: WalletAutoTopUp };
  return body.autoTopUp ?? { enabled: input.enabled, amountUsd: input.amountUsd };
}

/** SDK: end-user invoices (decimal dollars, not micros). */
export async function listUserInvoices(
  externalUserId: string,
  opts?: { page?: number; pageSize?: number },
) {
  const client = createPmtHouseClient();
  return client.listUserInvoices(externalUserId, opts);
}

export async function getUserInvoiceHostedUrl(
  externalUserId: string,
  invoiceId: string,
): Promise<AppUserInvoiceHostedUrlResult> {
  const client = createPmtHouseClient();
  return client.getUserInvoiceHostedUrl(externalUserId, invoiceId);
}

/** SDK: end-user payment methods. */
export async function listUserPaymentMethods(
  externalUserId: string,
): Promise<AppUserPaymentMethod[]> {
  const client = createPmtHouseClient();
  const result = await client.listUserPaymentMethods(externalUserId);
  return result.paymentMethods ?? [];
}

export async function startPaymentMethodCheckout(externalUserId: string) {
  const client = createPmtHouseClient();
  return client.createUserPaymentMethodCheckout({
    externalUserId,
    successUrl: `${appUrl()}/billing?topup=pm-saved`,
    cancelUrl: `${appUrl()}/billing?topup=canceled`,
  });
}

export async function ensureDefaultPaymentMethod(externalUserId: string) {
  const client = createPmtHouseClient();
  return client.ensureUserDefaultPaymentMethod(externalUserId);
}

/**
 * Prepaid top-up Checkout.
 * Not yet on builder-sdk — M2M POST …/billing/wallet/top-up (same as ComfyPeer).
 */
export async function startWalletTopUp(externalUserId: string, amountUsd: number) {
  const clientId = readPublicClientId();
  const response = await fetch(
    `${appsOrigin()}/api/v1/apps/${encodeURIComponent(clientId)}/billing/wallet/top-up`,
    {
      method: "POST",
      headers: {
        Authorization: m2mAuthHeader(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amountUsd: amountUsd.toFixed(2),
        externalUserId,
        successUrl: `${appUrl()}/billing?topup=succeeded`,
        cancelUrl: `${appUrl()}/billing?topup=canceled`,
      }),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new PmtHouseError(text || "Top-up failed", {
      status: response.status,
      code: "top_up_failed",
    });
  }
  return (await response.json()) as { checkoutUrl?: string; url?: string };
}

export type { AppUserInvoice, AppUserPaymentMethod };
export { PmtHouseError };
