import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { auth0Configured } from "@/lib/auth0-config";

export async function middleware(request: NextRequest) {
  // Until a real Auth0 application is wired up (see .env.example), pass every
  // request through untouched instead of letting the SDK throw on every page
  // load — the rest of the app already degrades to "signed out" gracefully
  // via lib/current-user.ts.
  if (!auth0Configured()) {
    return NextResponse.next();
  }
  try {
    return await auth0.middleware(request);
  } catch (error) {
    console.error("[auth0] middleware failed, passing request through", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
