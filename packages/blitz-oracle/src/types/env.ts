// Environment variable types for Cloudflare Workers
export interface CloudflareBindings {
    FIREBASE_PROJECT_ID?: string // Optional - will use service account file if not provided
    FIREBASE_DATABASE_URL?: string // Optional - will use default URL if not provided

    // Existing environment variables
    APP_PORT: string
    PRIVATE_KEY_BLITZ?: string
}
