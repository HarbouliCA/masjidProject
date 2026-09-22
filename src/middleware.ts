import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["ar", "es", "ca"];
const DEFAULT_LOCALE = "ar";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const hasLocale = segments.length > 0 && LOCALES.includes(segments[0]);

  if (hasLocale) {
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", segments[0], { path: "/" });
    return response;
  }

  const locale = DEFAULT_LOCALE; // Accept-Language negotiation lands later
  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(request.nextUrl);
  response.cookies.set("NEXT_LOCALE", locale, { path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
