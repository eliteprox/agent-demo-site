import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/current-user";
import { ensureDefaultPaymentMethod, listUserPaymentMethods, startPaymentMethodCheckout } from "@/lib/pymthouse";
import { pmtHouseErrorResponse, unauthorizedResponse } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSessionUser();
  if (!auth.ok) return unauthorizedResponse(auth);
  try {
    const paymentMethods = await listUserPaymentMethods(auth.user.externalUserId);
    return NextResponse.json({ paymentMethods });
  } catch (error) {
    return pmtHouseErrorResponse(error, "Failed to load payment methods");
  }
}

export async function POST() {
  const auth = await requireSessionUser();
  if (!auth.ok) return unauthorizedResponse(auth);
  try {
    const result = await startPaymentMethodCheckout(auth.user.externalUserId);
    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  } catch (error) {
    return pmtHouseErrorResponse(error, "Payment method checkout failed");
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSessionUser();
  if (!auth.ok) return unauthorizedResponse(auth);
  try {
    const body = (await request.json().catch(() => ({}))) as { ensureDefault?: boolean };
    if (!body.ensureDefault) {
      return NextResponse.json({ error: "ensureDefault required" }, { status: 400 });
    }
    const result = await ensureDefaultPaymentMethod(auth.user.externalUserId);
    return NextResponse.json(result);
  } catch (error) {
    return pmtHouseErrorResponse(error, "Failed to set default payment method");
  }
}
