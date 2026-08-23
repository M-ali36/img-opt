import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

  // Remove auth cookies
  res.cookies.set("auth_token", "", { expires: new Date(0), httpOnly: true });
  res.cookies.set("auth_role", "", { expires: new Date(0), httpOnly: true });

  return res;
}
