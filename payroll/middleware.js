import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const protectedAreas = [
  {
    test: (pathname) => /^\/admin(?:\/|$)/.test(pathname),
    allow: (role) => role === "admin",
  },
  {
    test: (pathname) => /^\/manager(?:\/|$)/.test(pathname),
    allow: (role) => role === "manager",
  },
  {
    test: (pathname) => /^\/employee\/attendance\/scan(?:\/|$)/.test(pathname),
    allow: (role) => role === "manager" || Boolean(role),
  },
  {
    test: (pathname) => /^\/employee(?:\/|$)/.test(pathname),
    allow: (role) => Boolean(role),
  },
];

function redirectToLogin(request) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const area = protectedAreas.find((entry) => entry.test(pathname));

  if (!area) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  if (!token || !process.env.JWT_SECRET) {
    return redirectToLogin(request);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (typeof payload.role !== "string" || !area.allow(payload.role)) {
      return redirectToLogin(request);
    }

    return NextResponse.next();
  } catch {
    return redirectToLogin(request);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/employee/:path*"],
};
