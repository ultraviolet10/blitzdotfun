import type { CloudflareBindings } from "../types/env"
import type {
    FirebaseData,
    FirebaseDeleteResponse,
    FirebaseObject,
    FirebaseUpdateResponse,
    FirebaseWriteResponse,
} from "../types/firebase"
import { getFirebaseToken } from "./firebase-auth"

/**
 * Firebase REST client for Cloudflare Workers
 */
export class FirebaseClient {
    private env: CloudflareBindings
    private baseUrl: string

    constructor(env: CloudflareBindings) {
        this.env = env
        this.baseUrl = env.FIREBASE_DATABASE_URL
    }

    /**
     * Write data to Firebase (PUT - replaces entire path)
     */
    async writeData(path: string, data: FirebaseData): Promise<FirebaseWriteResponse> {
        const token = await getFirebaseToken(this.env)
        const url = `${this.baseUrl}/${path}.json?auth=${token}`

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Firebase write failed: ${response.status} ${errorText}`)
        }

        return (await response.json()) as FirebaseWriteResponse
    }

    /**
     * Read data from Firebase (GET)
     */
    async readData<T = FirebaseData>(path: string): Promise<T | null> {
        const token = await getFirebaseToken(this.env)
        const url = `${this.baseUrl}/${path}.json?auth=${token}`

        const response = await fetch(url, {
            method: "GET",
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Firebase read failed: ${response.status} ${errorText}`)
        }

        return (await response.json()) as T | null
    }

    /**
     * Update data in Firebase (PATCH - merges with existing data)
     */
    async updateData(path: string, data: FirebaseObject): Promise<FirebaseUpdateResponse> {
        const token = await getFirebaseToken(this.env)
        const url = `${this.baseUrl}/${path}.json?auth=${token}`

        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Firebase update failed: ${response.status} ${errorText}`)
        }

        return (await response.json()) as FirebaseUpdateResponse
    }

    /**
     * Delete data from Firebase (DELETE)
     */
    async deleteData(path: string): Promise<FirebaseDeleteResponse> {
        const token = await getFirebaseToken(this.env)
        const url = `${this.baseUrl}/${path}.json?auth=${token}`

        const response = await fetch(url, {
            method: "DELETE",
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Firebase delete failed: ${response.status} ${errorText}`)
        }

        return (await response.json()) as FirebaseDeleteResponse // Returns null for successful delete
    }
}

/**
 * Helper function to create a Firebase client instance
 */
export function createFirebaseClient(env: CloudflareBindings): FirebaseClient {
    return new FirebaseClient(env)
}
