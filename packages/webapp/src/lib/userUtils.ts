/**
 * USER UTILITY FUNCTIONS
 *
 * This module contains helper functions for extracting and processing user data
 * from the Privy authentication system. Privy supports multiple wallet connection
 * types, so these utilities normalize the different data structures.
 *
 * Key concepts:
 * - Direct wallet connection: User connects MetaMask, Coinbase Wallet, etc. directly
 * - Cross-app connection: User logs in via Zora's embedded wallet system
 * - Smart wallets: Advanced wallet types that may have different address structures
 *
 * These utilities help extract consistent data regardless of connection type.
 */

import type { User } from "@privy-io/react-auth"
import type { Address } from "viem"

/**
 * Extracts the wallet address from a Privy user object.
 *
 * Privy supports two main connection types:
 * 1. Direct wallet connection (user.wallet.address)
 * 2. Cross-app connection via Zora (linkedAccounts with smartWallets)
 *
 * This function checks both sources and returns the first valid address found.
 */
export const getWalletAddress = (user: User): Address | null => {
    // First check direct wallet connection
    if (user?.wallet?.address) {
        return user.wallet.address as Address
    }

    // Check for cross_app linked accounts (Zora login)
    const crossAppAccount = user?.linkedAccounts?.find((account) => account.type === "cross_app")
    if (crossAppAccount?.smartWallets?.[0]?.address) {
        return crossAppAccount.smartWallets[0].address as Address
    }

    return null
}

/**
 * Returns a human-readable string describing the wallet connection type.
 *
 * This helps the UI display meaningful information to users about how
 * they connected their wallet (MetaMask, Coinbase, Zora, etc.).
 */
export const getWalletType = (user: User): string => {
    if (user?.wallet?.walletClientType) {
        return user.wallet.walletClientType
    }

    const crossAppAccount = user?.linkedAccounts?.find((account) => account.type === "cross_app")
    if (crossAppAccount) {
        return "Cross-app (Smart Wallet)"
    }

    return "Unknown"
}

/**
 * Determines if the user logged in via Zora's cross-app connection.
 *
 * When users choose the Zora login option in Privy, they're using Privy's
 * cross-app wallet feature to connect with their existing Zora account.
 * This is different from directly connecting a wallet like MetaMask.
 *
 * This information is useful for:
 * - UI messaging ("Welcome back to Zora!" vs "Welcome!")
 * - Potentially optimizing Zora profile fetching
 * - Analytics and user journey tracking
 */
export const isZoraLogin = (user: User): boolean => {
    return user?.linkedAccounts?.some((account) => account.type === "cross_app") ?? false
}
