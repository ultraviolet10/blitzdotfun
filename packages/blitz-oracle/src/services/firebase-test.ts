import type { CloudflareBindings } from "../types/env"

// Temporary test file to verify Firebase connection
export async function testFirebaseConnection(env: CloudflareBindings) {
    const projectId = env.FIREBASE_PROJECT_ID
    const databaseUrl = env.FIREBASE_DATABASE_URL
    const serviceAccount = env.FIREBASE_SERVICE_ACCOUNT

    console.log("Firebase Config Check:")
    console.log("- Project ID:", projectId)
    console.log("- Database URL:", databaseUrl)
    console.log("- Service Account exists:", !!serviceAccount)

    if (!projectId || !databaseUrl || !serviceAccount) {
        throw new Error("Missing Firebase environment variables")
    }

    // Try to parse service account JSON
    try {
        const parsed = JSON.parse(serviceAccount)
        console.log("- Service Account Email:", parsed.client_email)
        return true
    } catch (_error) {
        throw new Error("Invalid service account JSON")
    }
}
