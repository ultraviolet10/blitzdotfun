/**
 * GRACEFUL AUTH SYNC HOOK
 *
 * This hook automatically syncs BlitzUser data to the database without creating
 * additional loading states. It integrates seamlessly with the compound user state
 * system and performs background syncing.
 *
 * Key features:
 * - Uses existing BlitzUser state from userAtoms (no duplicate loading states)
 * - Syncs both Privy auth data and Zora profile data to database
 * - Performs background sync without blocking UI
 * - Handles errors gracefully without affecting user experience
 * - Debounced to prevent excessive API calls
 */

import { useAtom } from "jotai"
import { useCallback, useEffect, useRef } from "react"
import { compoundUserAtom } from "@/atoms/userAtoms"

// Define interfaces for Privy account types
interface SmartWallet {
    address: string
}

interface CrossAppAccount {
    type: "cross_app"
    smartWallets?: SmartWallet[]
}

/**
 * Hook to automatically sync BlitzUser data to database.
 * This runs in the background and doesn't create additional loading states.
 */
export function useAuthSync() {
    const [blitzUser] = useAtom(compoundUserAtom)
    const syncTimeoutRef = useRef<NodeJS.Timeout>(null)
    const lastSyncDataRef = useRef<string>("")

    /**
     * Sync function that sends BlitzUser data to the database.
     * This runs in the background without affecting UI state.
     */
    const syncToDatabase = useCallback(async () => {
        const { auth, profile } = blitzUser

        // Only sync if we have authenticated user data
        if (!auth.user || !auth.walletAddress) {
            return
        }

        // Create a hash of the current data to avoid unnecessary syncs
        const currentDataHash = JSON.stringify({
            userId: auth.user.id,
            walletAddress: auth.walletAddress,
            walletType: auth.walletType,
            isZoraLogin: auth.isZoraLogin,
            profileData: profile.data
                ? {
                      username: profile.data.username,
                      displayName: profile.data.displayName,
                      bio: profile.data.bio,
                      avatar: profile.data.avatar,
                      handle: profile.data.handle,
                  }
                : null,
        })

        // Skip if data hasn't changed
        if (currentDataHash === lastSyncDataRef.current) {
            return
        }

        try {
            const response = await fetch("/api/auth/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    // Privy auth data
                    id: auth.user.id,
                    createdAt: auth.user.createdAt,
                    walletAddress: auth.walletAddress,
                    walletType: auth.walletType,
                    isZoraLogin: auth.isZoraLogin,

                    // Raw Privy data for database storage
                    wallet: auth.user.wallet
                        ? {
                              address: auth.user.wallet.address,
                              walletClientType: auth.user.wallet.walletClientType,
                          }
                        : undefined,

                    linkedAccounts: auth.user.linkedAccounts
                        ?.filter((account) => account.type === "cross_app")
                        .map((account) => ({
                            type: account.type,
                            smartWallets:
                                account.type === "cross_app" && "smartWallets" in account
                                    ? (account as CrossAppAccount).smartWallets?.map((wallet: SmartWallet) => ({
                                          address: wallet.address,
                                      }))
                                    : [],
                        })),

                    // Zora profile data
                    zoraProfile: profile.data
                        ? {
                              id: profile.data.id,
                              handle: profile.data.handle,
                              username: profile.data.username,
                              displayName: profile.data.displayName,
                              bio: profile.data.bio,
                              avatar: profile.data.avatar,
                              website: profile.data.website,
                              // Add other available Zora fields as needed
                          }
                        : null,
                }),
            })

            if (response.ok) {
                // Update the last sync hash on successful sync
                lastSyncDataRef.current = currentDataHash
            } else {
                console.warn("Auth sync failed:", response.statusText)
            }
        } catch (error) {
            // Log error but don't throw - this is background sync
            console.warn("Background auth sync error:", error)
        }
    }, [blitzUser])

    /**
     * Debounced sync effect that triggers when BlitzUser data changes.
     * Uses a timeout to prevent excessive API calls during rapid state changes.
     */
    useEffect(() => {
        // Clear existing timeout
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current)
        }

        // Set new timeout for debounced sync
        syncTimeoutRef.current = setTimeout(() => {
            syncToDatabase()
        }, 1000) // 1 second debounce

        // Cleanup timeout on unmount
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current)
            }
        }
    }, [syncToDatabase])

    // Return the BlitzUser data (no additional loading states)
    return {
        blitzUser,
        // Helper to manually trigger sync if needed
        syncToDatabase,
    }
}
