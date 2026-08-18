import "server-only";

import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { auth0Configured } from "@/lib/auth0-config";
import { ensureAppUserProvisioned } from "@/lib/pymthouse";
import { externalUserIdFromAuth0Sub } from "@/lib/external-user-id";

export type CurrentUser = {
  externalUserId: string;
  email: string;
  name: string;
  picture?: string;
};

async function resolveUser(): Promise<CurrentUser | null> {
  // Same reasoning as middleware.ts: without a real Auth0 app configured,
  // auth0.getSession() throws — degrade to "signed out" instead of a 500.
  if (!auth0Configured()) return null;
  const session = await auth0.getSession();
  const user = session?.user;
  if (!user?.sub) return null;
  const email = typeof user.email === "string" ? user.email : "";
  return {
    externalUserId: externalUserIdFromAuth0Sub(user.sub),
    email,
    name: typeof user.name === "string" && user.name.trim() ? user.name : email || "User",
    picture: typeof user.picture === "string" ? user.picture : undefined,
  };
}

/** Server components / layouts: resolved user, or null when signed out. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return resolveUser();
}

/** Server components that require auth: redirects to /auth/login otherwise. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  await ensureAppUserProvisioned(user.externalUserId, user.email);
  return user;
}

/**
 * Route Handlers: resolve the caller from their Auth0 session cookie. Never
 * trust a client-supplied externalUserId — the session is the only source of
 * truth for which PymtHouse end user a request is allowed to touch. This is
 * intentionally stricter than ComfyPeer today, where only the wallet PATCH
 * route checks ownership and the rest trust a body/query externalUserId.
 */
export async function requireSessionUser(): Promise<
  { ok: true; user: CurrentUser } | { ok: false; status: number; error: string }
> {
  const user = await resolveUser();
  if (!user) {
    return { ok: false, status: 401, error: "Sign in required" };
  }
  return { ok: true, user };
}
