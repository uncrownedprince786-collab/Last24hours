import { NextRequest, NextResponse } from "next/server";
import { adminCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
  void req;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName(), "", { path: "/", maxAge: 0 });
  return res;
}