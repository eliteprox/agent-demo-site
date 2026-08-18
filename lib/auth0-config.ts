// Deliberately not `server-only` — this needs to run from middleware.ts too.

/** True once a real Auth0 application is wired up (see .env.example). */
export function auth0Configured(): boolean {
  return Boolean(
    process.env.AUTH0_SECRET?.trim() &&
      process.env.AUTH0_ISSUER_BASE_URL?.trim() &&
      process.env.AUTH0_CLIENT_ID?.trim() &&
      process.env.AUTH0_CLIENT_SECRET?.trim(),
  );
}
