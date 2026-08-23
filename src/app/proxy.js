export const runtime = "edge";

import { NextResponse } from "next/server";

export default async function proxy(request) {
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("auth_role")?.value;

  const { pathname } = request.nextUrl;

  // No login → block access
  if (!token) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/user")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Role handling
  if (role === "user" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/user", request.url));
  }

  if (role === "admin" && pathname.startsWith("/user")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
};
