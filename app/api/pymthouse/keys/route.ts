import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/current-user";
import { createUserApiKey } from "@/lib/pymthouse";
import { pmtHouseErrorResponse, unauthorizedResponse } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mints one API key for the signed-in user. PymtHouse's Builder API has no
 * list/rename/revoke surface for keys (mint-only), so — like ComfyPeer's
 * settings page — the raw key is returned once here and never persisted or
 * re-shown; the client is responsible for displaying it exactly once.
 */
export async function POST(request: Request) {
  const auth = await requireSessionUser();
  if (!auth.ok) return unauthorizedResponse(auth);
  try {
    const body = (await request.json().catch(() => ({}))) as { label?: string };
    const created = await createUserApiKey(auth.user.externalUserId, body.label);
    return NextResponse.json({
      apiKey: created.apiKey,
      sdkToken: created.sdkToken ?? null,
      id: created.id,
    });
  } catch (error) {
    return pmtHouseErrorResponse(error, "key_mint_failed");
  }
}
