import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/current-user";
import { listUserPaymentMethods, loadUserCreditBalance, loadWalletAutoTopUp, saveWalletAutoTopUp } from "@/lib/pymthouse";
import { parseTopUpAmountUsd } from "@/lib/top-up-amount";
import { pmtHouseErrorResponse, unauthorizedResponse } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSessionUser();
  if (!auth.ok) return unauthorizedResponse(auth);
  try {
    const [creditsResult, autoTopUpResult] = await Promise.allSettled([
      loadUserCreditBalance(auth.user.externalUserId),
      loadWalletAutoTopUp(auth.user.externalUserId),
    ]);
    if (creditsResult.status === "rejected") {
      throw creditsResult.reason;
    }
    const autoTopUp = autoTopUpResult.status === "fulfilled" ? autoTopUpResult.value : null;
    return NextResponse.json({ credits: creditsResult.value, autoTopUp });
  } catch (error) {
    return pmtHouseErrorResponse(error, "Failed to load billing");
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSessionUser();
  if (!auth.ok) return unauthorizedResponse(auth);
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
  }
  const parsedAmount = parseTopUpAmountUsd(body.amountUsd ?? "10");
  if (body.enabled && !parsedAmount.ok) {
    return NextResponse.json({ error: parsedAmount.error }, { status: 400 });
  }
  const amountUsd = parsedAmount.ok ? parsedAmount.amount.toFixed(2) : "10.00";
  try {
    if (body.enabled) {
      const paymentMethods = await listUserPaymentMethods(auth.user.externalUserId);
      if (paymentMethods.length === 0) {
        return NextResponse.json(
          { error: "Add a card before enabling auto top-up." },
          { status: 400 },
        );
      }
    }
    const autoTopUp = await saveWalletAutoTopUp({
      externalUserId: auth.user.externalUserId,
      enabled: body.enabled,
      amountUsd,
    });
    return NextResponse.json({ autoTopUp });
  } catch (error) {
    return pmtHouseErrorResponse(error, "Failed to save auto top-up");
  }
}
