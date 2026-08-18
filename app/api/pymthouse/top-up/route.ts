import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/current-user";
import { startWalletTopUp } from "@/lib/pymthouse";
import { parseTopUpAmountUsd } from "@/lib/top-up-amount";
import { pmtHouseErrorResponse, unauthorizedResponse } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireSessionUser();
  if (!auth.ok) return unauthorizedResponse(auth);
  try {
    const body = (await request.json().catch(() => ({}))) as { amountUsd?: number | string };
    const parsed = parseTopUpAmountUsd(body.amountUsd ?? 10);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const result = await startWalletTopUp(auth.user.externalUserId, parsed.amount);
    return NextResponse.json({ url: result.checkoutUrl || result.url || null });
  } catch (error) {
    return pmtHouseErrorResponse(error, "top_up_failed");
  }
}
