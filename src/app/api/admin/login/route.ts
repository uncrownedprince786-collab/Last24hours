import { NextRequest, NextResponse } from "next/server";
import { signToken, getAdminSecret, adminCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = body?.password;
  if (typeof password !== "string" || password !== getAdminSecret()) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  const token = await signToken("admin", getAdminSecret());
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}