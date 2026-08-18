import "server-only";

import { createHash } from "node:crypto";

/**
 * PymtHouse's `externalUserId` must match `/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/`
 * (see @pymthouse/builder-sdk's `parseExternalUserId`) — no `@`, no `|`. Auth0's
 * `sub` claim (e.g. `google-oauth2|1234567890`) fails that directly, so we hash
 * it into a stable, valid id instead of storing a mapping anywhere.
 */
export function externalUserIdFromAuth0Sub(sub: string): string {
  const normalized = sub.trim();
  const hex = createHash("sha256")
    .update(`livepeer-agent:externalUserId:${normalized}`)
    .digest("hex");
  return `eu_${hex.slice(0, 32)}`;
}
