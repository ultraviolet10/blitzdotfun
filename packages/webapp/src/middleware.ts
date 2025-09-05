import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Public paths that don't require authentication
    const publicPaths = ["/", "/favicon.ico"]

    // Check if the current path is public
    const isPublicPath = publicPaths.some((path) => pathname === path)

    // Allow public paths and Next.js internal paths
    if (isPublicPath || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
        return NextResponse.next()
    }

    // For all other paths, continue (auth handled client-side)
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (SEO files)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
}
