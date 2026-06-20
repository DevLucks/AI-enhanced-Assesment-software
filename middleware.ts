import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role as string | undefined;
  const path = nextUrl.pathname;

  const isPublicPath =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password");

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isPublicPath) {
    const dest = role === "ADMIN" ? "/admin" : role === "LECTURER" ? "/lecturer" : "/student";
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  if (isLoggedIn) {
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${role?.toLowerCase()}`, nextUrl));
    }
    if (path.startsWith("/lecturer") && role !== "LECTURER") {
      return NextResponse.redirect(new URL(`/${role?.toLowerCase()}`, nextUrl));
    }
    if (path.startsWith("/student") && role !== "STUDENT") {
      return NextResponse.redirect(new URL(`/${role?.toLowerCase()}`, nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
