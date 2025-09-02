// Firebase-related types

/**
 * Google Service Account structure
 */
export interface ServiceAccount {
    type: "service_account"
    project_id: string
    private_key_id: string
    private_key: string
    client_email: string
    client_id: string
    auth_uri: string
    token_uri: string
    auth_provider_x509_cert_url: string
    client_x509_cert_url: string
    universe_domain?: string
}

/**
 * Google OAuth token response
 */
export interface TokenResponse {
    access_token: string
    expires_in: number
    token_type: string
    scope?: string
}

/**
 * Generic Firebase data type
 */
export type FirebaseData = string | number | boolean | null | FirebaseData[] | { [key: string]: FirebaseData }

/**
 * Firebase object type for updates and writes
 */
export type FirebaseObject = { [key: string]: FirebaseData }

/**
 * Firebase REST API response types
 * Note: Firebase REST API returns data directly, not wrapped in response objects
 */
export type FirebaseWriteResponse = FirebaseData
export type FirebaseReadResponse<T = FirebaseData> = T | null
export type FirebaseUpdateResponse = FirebaseData
export type FirebaseDeleteResponse = null

/**
 * Cloudflare Workers scheduled event types
 */
export interface ScheduledEvent {
    type: "scheduled"
    cron: string
    scheduledTime: number
}

export interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void
    passThroughOnException(): void
}

/**
 * Firebase Query Operations
 */
export interface FirebaseQuery {
    orderBy?: string
    startAt?: string | number
    endAt?: string | number
    limitToFirst?: number
    limitToLast?: number
    equalTo?: string | number | boolean
}

/**
 * Firebase Batch Operations
 */
export interface FirebaseBatchOperation {
    method: "PUT" | "PATCH" | "POST" | "DELETE"
    path: string
    body?: FirebaseData
}

export interface FirebaseBatchResponse {
    [key: string]: FirebaseData
}
