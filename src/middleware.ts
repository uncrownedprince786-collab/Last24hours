import { NextRequest, NextResponse } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "./lib/i18n/config";
import { resolveLocale } from "./lib/i18n/resolve";

const SKIP_PREFIXES = ["/api", "/admin", "/_next", "/images"];
const LOCALE_CODES = new Set(LOCALES.map((l) => l.code));

function looksStatic(pathname: string): boolean {
  if (pathname.includes(".")) return true;
  return /.*\.(ico|png|jpg|jpeg|webp|svg|txt|xml|json|css|js|map|ico)$/i.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    looksStatic(pathname)
  ) {
    return NextResponse.next();
  }

  const preferred = request.cookies.get("L24_LOCALE")?.value ?? null;
  const acceptLanguage = request.headers.get("accept-language");
  const country = request.headers.get("x-vercel-ip-country");
  const locale = resolveLocale({ preferred, acceptLanguage, country });

  const response = request.nextUrl.pathname === "/"
    ? NextResponse.redirect(new URL(`/${locale}/`, request.url), 307)
    : NextResponse.next();
  response.headers.set("x-locale", locale);

  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  if (first && !LOCALE_CODES.has(first)) {
    const target = new URL(`/${locale}/${pathname.replace(/^\/+/, "")}`, request.url);
    return NextResponse.redirect(target, 308);
  }
  void DEFAULT_LOCALE;

  return response;
}

export const config = {
  matcher: [
    "/((?!api|admin|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};