/**
 * COMPOUND USER STATE MANAGEMENT
 *
 * This file manages the unified user state that combines both Privy authentication data
 * and Zora profile data into a single, cohesive state object called BlitzUser.
 *
 * Why compound state?
 * - Users authenticate with Privy (wallet connection)
 * - We then fetch their Zora profile data (social profile, avatar, etc.)
 * - Instead of managing these separately, we combine them for easier component consumption
 * - Loading and error states are tracked for both data sources independently
 *
 * Architecture:
 * - Main atom: compoundUserAtom holds the complete BlitzUser state
 * - Derived atoms: authDataAtom, profileDataAtom, etc. for granular updates
 * - Components can read the full state or subscribe to specific parts
 */

import type { User } from "@privy-io/react-auth"
import type { GetProfileResponse } from "@zoralabs/coins-sdk"
import { atom } from "jotai"
import type { Address } from "viem"

/**
 * BlitzUser represents the complete user state combining authentication and profile data.
 * This is the single source of truth for all user-related information in the app.
 */
export interface BlitzUser {
    auth: {
        user: User | null // Raw Privy user object
        walletAddress: Address | null // Extracted wallet address (direct or cross-app)
        walletType: string | null // Human-readable wallet type
        isZoraLogin: boolean // Whether user logged in via Zora cross-app
    }
    profile: {
        data: GetProfileResponse["profile"] | null // Zora profile data (avatar, bio, etc.)
    }
    loading: {
        auth: boolean // Privy authentication loading state
        profile: boolean // Zora profile fetch loading state
    }
    errors: {
        auth: Error | null // Authentication errors
        profile: Error | null // Profile fetch errors
    }
}

/**
 * Initial empty state for the compound user.
 * This is what the state looks like before any authentication or data fetching occurs.
 */
const initialCompoundUser: BlitzUser = {
    auth: {
        user: null,
        walletAddress: null,
        walletType: null,
        isZoraLogin: false,
    },
    profile: {
        data: null,
    },
    loading: {
        auth: false,
        profile: false,
    },
    errors: {
        auth: null,
        profile: null,
    },
}

/**
 * Main atom that holds the complete BlitzUser state.
 * Components typically read from this atom to get all user-related data in one place.
 */
export const compoundUserAtom = atom<BlitzUser>(initialCompoundUser)

/**
 * Derived atom for authentication data.
 * Used by AuthGuard and other auth-related components to update just the auth portion
 * of the compound state without affecting profile data.
 */
export const authDataAtom = atom(
    (get) => get(compoundUserAtom).auth,
    (get, set, authData: Partial<BlitzUser["auth"]>) => {
        const current = get(compoundUserAtom)
        set(compoundUserAtom, {
            ...current,
            auth: { ...current.auth, ...authData },
        })
    },
)

/**
 * Derived atom for Zora profile data.
 * Used by the useZora hook to update profile information independently
 * of authentication state.
 */
export const profileDataAtom = atom(
    (get) => get(compoundUserAtom).profile,
    (get, set, profileData: Partial<BlitzUser["profile"]>) => {
        const current = get(compoundUserAtom)
        set(compoundUserAtom, {
            ...current,
            profile: { ...current.profile, ...profileData },
        })
    },
)

/**
 * Derived atom for loading states.
 * Allows components to show loading indicators for specific operations
 * (auth vs profile fetching) independently.
 */
export const loadingAtom = atom(
    (get) => get(compoundUserAtom).loading,
    (get, set, loading: Partial<BlitzUser["loading"]>) => {
        const current = get(compoundUserAtom)
        set(compoundUserAtom, {
            ...current,
            loading: { ...current.loading, ...loading },
        })
    },
)

/**
 * Derived atom for error states.
 * Enables error handling for authentication vs profile fetching separately,
 * so users can see specific error messages for failed operations.
 */
export const errorsAtom = atom(
    (get) => get(compoundUserAtom).errors,
    (get, set, errors: Partial<BlitzUser["errors"]>) => {
        const current = get(compoundUserAtom)
        set(compoundUserAtom, {
            ...current,
            errors: { ...current.errors, ...errors },
        })
    },
)
