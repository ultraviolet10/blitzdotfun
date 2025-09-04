import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname;

  // Define paths that should be publicly accessible
  const isPublicPath =
    path === "/login" ||
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path === "/favicon.ico";

  // For now, we'll handle auth check on the client side
  // This middleware just ensures the login route is accessible
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For all other paths, let them through - auth will be handled client-side
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
