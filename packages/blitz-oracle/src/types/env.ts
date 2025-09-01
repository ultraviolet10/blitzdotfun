// Environment variable types for Cloudflare Workers
export interface CloudflareBindings {
    FIREBASE_PROJECT_ID: string
    FIREBASE_DATABASE_URL: string
    FIREBASE_SERVICE_ACCOUNT: string

    // Existing environment variables
    APP_PORT: string
    PRIVATE_KEY_BLITZ?: string
}
