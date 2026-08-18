import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Single Auth0 client instance for this app. Handles /auth/login, /auth/logout,
 * /auth/callback, and /auth/profile automatically via middleware.ts — no
 * hand-rolled session cookie signing (contrast with ComfyPeer's lib/session.ts).
 */
export const auth0 = new Auth0Client();
