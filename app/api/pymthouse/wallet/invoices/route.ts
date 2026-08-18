import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/current-user";
import { listUserInvoices } from "@/lib/pymthouse";
import { pmtHouseErrorResponse, unauthorizedResponse } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePageParam(raw: string | null): number | undefined {
  if (!raw || !/^[1-9]\d*$/.test(raw)) return undefined;
  return Number(raw);
}

export async function GET(request: NextRequest) {
  const auth = await requireSessionUser();
  if (!auth.ok) return unauthorizedResponse(auth);
  try {
    const result = await listUserInvoices(auth.user.externalUserId, {
      page: parsePageParam(request.nextUrl.searchParams.get("page")),
      pageSize: parsePageParam(request.nextUrl.searchParams.get("pageSize")) ?? 20,
    });
    return NextResponse.json(result);
  } catch (error) {
    return pmtHouseErrorResponse(error, "Failed to load invoices");
  }
}
