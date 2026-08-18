import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/current-user";
import { getUserInvoiceHostedUrl } from "@/lib/pymthouse";
import { pmtHouseErrorResponse, unauthorizedResponse } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireSessionUser();
  if (!auth.ok) return unauthorizedResponse(auth);
  const { id: invoiceId } = await context.params;
  if (!invoiceId?.trim()) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }
  try {
    const result = await getUserInvoiceHostedUrl(auth.user.externalUserId, invoiceId.trim());
    return NextResponse.json(result);
  } catch (error) {
    return pmtHouseErrorResponse(error, "Failed to resolve invoice URL");
  }
}
