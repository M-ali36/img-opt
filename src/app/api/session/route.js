import { NextResponse } from "next/server";

export async function POST(req) {
  const { token, role, uid } = await req.json();

  const isProd = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ success: true });

  // Auth token cookie
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: isProd ? true : false,
    sameSite: "lax",
    path: "/",
  });

  // ROLE cookie (must match proxy: "auth_role")
  res.cookies.set("auth_role", role, {
    httpOnly: true,
    secure: isProd ? true : false,
    sameSite: "lax",
    path: "/",
  });

  // UID cookie
  res.cookies.set("uid", uid, {
    httpOnly: true,
    secure: isProd ? true : false,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
