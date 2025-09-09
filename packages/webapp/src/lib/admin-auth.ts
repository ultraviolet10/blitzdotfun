/**
 * ADMIN AUTHENTICATION SYSTEM
 *
 * Simple password-based authentication for developers to access admin functionality.
 * This is a basic system for internal use - not meant for production user authentication.
 */

import type { NextRequest } from "next/server"

// Admin password - in production, this should be in environment variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "blitz-admin-2024"

/**
 * Verify admin authentication from request headers
 */
export function verifyAdminAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
        return false
    }

    // Expect "Bearer <password>" format
    const [type, password] = authHeader.split(" ")

    if (type !== "Bearer" || !password) {
        return false
    }

    return password === ADMIN_PASSWORD
}

/**
 * Create admin auth response for unauthorized access
 */
export function createUnauthorizedResponse() {
    return new Response(
        JSON.stringify({
            error: "Unauthorized",
            message: "Admin authentication required. Use Bearer token with admin password.",
        }),
        {
            status: 401,
            headers: {
                "Content-Type": "application/json",
            },
        },
    )
}

/**
 * Middleware function to protect admin routes
 */
export function requireAdminAuth<T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<Response>,
) {
    return async (request: NextRequest, ...args: T): Promise<Response> => {
        if (!verifyAdminAuth(request)) {
            return createUnauthorizedResponse()
        }

        return handler(request, ...args)
    }
}

/**
 * Authenticate admin request and return result
 */
export async function authenticateAdmin(request: NextRequest): Promise<{
    success: boolean
    error?: string
}> {
    if (!verifyAdminAuth(request)) {
        return {
            success: false,
            error: "Unauthorized - Admin authentication required"
        }
    }
    
    return { success: true }
}
