import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/current-user";
import { loadUserCreditBalance } from "@/lib/pymthouse";
import { pmtHouseErrorResponse, unauthorizedResponse } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight balance readout for the nav shell / home onboarding step. */
export async function GET() {
  const auth = await requireSessionUser();
  if (!auth.ok) return unauthorizedResponse(auth);
  try {
    const credits = await loadUserCreditBalance(auth.user.externalUserId);
    const live = Number(credits.live);
    return NextResponse.json({
      spendableUsd: credits.live,
      canSpend: Number.isFinite(live) && live > 0,
    });
  } catch (error) {
    return pmtHouseErrorResponse(error, "account_fetch_failed");
  }
}
