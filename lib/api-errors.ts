import { NextResponse } from "next/server";
import { PmtHouseError } from "@/lib/pymthouse";

/** Shared PmtHouseError -> NextResponse mapping for every /api/pymthouse/* route. */
export function pmtHouseErrorResponse(error: unknown, fallback: string): NextResponse {
  if (error instanceof PmtHouseError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status || 500 },
    );
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export function unauthorizedResponse(auth: { status: number; error: string }): NextResponse {
  return NextResponse.json({ error: auth.error }, { status: auth.status });
}
