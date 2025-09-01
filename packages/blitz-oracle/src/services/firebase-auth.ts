import jwt from "@tsndr/cloudflare-worker-jwt"
import type { CloudflareBindings } from "../types/env"
import type { ServiceAccount, TokenResponse } from "../types/firebase"

// Cached token storage
let cachedToken: string | null = null
let tokenExpiresAt: number = 0

/**
 * Get a valid Firebase access token, using cache when possible
 */
export async function getFirebaseToken(env: CloudflareBindings): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000)
    if (cachedToken && tokenExpiresAt > now + 300) {
        return cachedToken
    }

    // Generate new token
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)
    const accessToken = await generateFirebaseAccessToken(serviceAccount)

    // Cache the token (expires in 1 hour)
    cachedToken = accessToken
    tokenExpiresAt = now + 3600

    return accessToken
}

/**
 * Generate Firebase access token using service account
 */
async function generateFirebaseAccessToken(serviceAccount: ServiceAccount): Promise<string> {
    const now = Math.floor(Date.now() / 1000)

    // Create JWT payload for Google OAuth
    const payload = {
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600, // 1 hour
        iat: now,
    }

    // Sign JWT with service account private key
    const signedJWT = await jwt.sign(payload, serviceAccount.private_key, { algorithm: "RS256" })

    // Exchange JWT for access token
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: signedJWT,
        }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to get Firebase access token: ${response.status} ${errorText}`)
    }

    const data = (await response.json()) as TokenResponse
    return data.access_token
}

/**
 * Clear cached token (useful for testing or error recovery)
 */
export function clearTokenCache(): void {
    cachedToken = null
    tokenExpiresAt = 0
}
