# Livepeer Agent (demo)

A real console for a Livepeer Agent product — account, credit balance, top-up,
auto-reload, payment method, invoices, and API key minting — built as a working
clone of the front-end mockup at
[livepeer.peaceno.de/mockups/livepeer-agent](https://livepeer.peaceno.de/mockups/livepeer-agent),
wired to real payment flows the same way [ComfyPeer](../comfypeer) already does.

## Stack

- Next.js 15 (App Router) · React 19 · Tailwind CSS v4
- PymtHouse Builder API (`@pymthouse/builder-sdk`) for credits, top-up, payment
  methods, invoices, and API key minting — see `lib/pymthouse.ts`.
- Auth0 (`@auth0/nextjs-auth0`) for login — see `lib/auth0.ts` and
  `middleware.ts`. Every `/api/pymthouse/*` route resolves the caller from the
  Auth0 session server-side (`lib/current-user.ts`); no route ever trusts a
  client-supplied `externalUserId`.

## What's real vs. static

- **Real, backed by PymtHouse**: sign-in, balance (`/usage`), top-up /
  auto-reload / payment method / invoices (`/billing`), API key minting
  (`/api`, mint-once/reveal-once — PymtHouse has no key list/revoke endpoint).
- **Static, no backend**: `/playbooks` (recipe catalog), the home page's
  research feed, and `/api-logs` (PymtHouse has no request-log API; it ships
  as the mockup's own honest empty state).

## Develop

```bash
pnpm install
cp .env.example .env.local   # fill in PymtHouse + Auth0 creds
pnpm dev
```

Auth0 setup: create a Regular Web Application, enable the Google social
connection, and set the callback URL to `{AUTH0_BASE_URL}/auth/callback`.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Local server |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (zero warnings) |
