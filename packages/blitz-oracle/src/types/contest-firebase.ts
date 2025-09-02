import type { Address } from "viem"
import type { ContestStatus } from "../handlers/create/types"

/**
 * Firebase-optimized contest schema designed for mini-app integration
 * Supports real-time updates, efficient querying, and scalable structure
 */

// Core Firebase Contest Structure
export interface FirebaseContest {
    basicInfo: {
        contestId: string
        name: string
        status: ContestStatus
        createdAt: number
        contractAddress: string
        depositDeadline?: number
        contentDeadline?: number
        battleEndTime?: number
        // Mini-app specific fields
        tokenConversionRate?: number // tokens worth $500 USD
        prizeAmount?: string // e.g., "$500"
    }

    participants: {
        [walletAddress: string]: {
            handle: string
            walletAddress: string
            zoraProfile?: string
            role: "creator" | "participant" // Mini-app role differentiation

            // Deposit tracking
            deposits: {
                detected: boolean
                txHash?: string
                timestamp?: number
                amountRequired?: string // tokens needed for $500
                amountDeposited?: string
            }

            // Content submission tracking
            contentPosts: {
                detected: boolean
                zoraPostUrl?: string
                contentCoinAddress?: Address // deployed content coin
                timestamp?: number
                hasBlitzTag?: boolean // contains "blitzdotfun" in caption
                contentType?: "post" | "video" | "image"
            }

            // Battle participation
            battle: {
                canPurchase: boolean // false for creators (their own content)
                purchaseRedirectUrl?: string // redirect URL for participants
                votesReceived: number
            }
        }
    }

    // Battle/Contest state
    battle?: {
        battleId: string
        startTime: number
        endTime: number
        isActive: boolean

        // Content coins for the battle
        creatorOneCoin?: Address
        creatorTwoCoin?: Address

        // Battle metrics
        totalVolume: number
        totalVotes: number
        winner?: string // walletAddress of winner
    }

    // Real-time metrics for mini-app
    metrics?: {
        participantOneVotes: number
        participantTwoVotes: number
        lastUpdated: number

        // Market data
        coin1MarketCap?: number
        coin2MarketCap?: number
        coin1Volume?: number
        coin2Volume?: number
        coin1Price?: number
        coin2Price?: number

        // Contest progress
        depositsCompleted: number
        contentSubmitted: number
        readyForBattle: boolean
    }

    // Mini-app callback system
    callbacks: {
        depositCallbacks: string[] // walletAddresses to notify on deposit
        contentCallbacks: string[] // walletAddresses to notify on content
        battleStartCallbacks: string[] // walletAddresses to notify on battle start
        lastCallbackSent?: number
    }
}

// Index structures for efficient querying
export interface ContestIndex {
    [contestId: string]: boolean | ContestIndexData
}

export interface ContestIndexData {
    createdAt: number
    status: ContestStatus
    name: string
    participants: string[] // wallet addresses
    isCreator?: boolean // for participant-specific indexes
}

// Mini-app specific query responses
export interface OngoingContestResponse {
    contest: {
        contestId: string
        name: string
        status: ContestStatus
        participants: {
            handle: string
            walletAddress: string
            zoraProfile?: string
            role: "creator" | "participant"
            hasDeposited: boolean
            hasSubmittedContent: boolean
            canPurchase: boolean
            purchaseUrl?: string
        }[]
        battle?: {
            battleId: string
            isActive: boolean
            timeRemaining: number
            creatorOneCoin?: Address
            creatorTwoCoin?: Address
        }
        userRole: "creator" | "participant" | "spectator"
        requiredTokens?: number
        prizeAmount: string
    }
}

export interface UpcomingContestResponse {
    contest: {
        contestId: string
        name: string
        status: ContestStatus
        participants: {
            handle: string
            walletAddress: string
            zoraProfile?: string
        }[]
        depositDeadline?: number
        contentDeadline?: number
        userRole: "creator" | "participant" | "spectator"
        nextAction?: "deposit" | "content" | "wait"
    }
}

// Callback payload types for mini-app notifications
export interface ContestCallback {
    type: "deposit-detected" | "content-submitted" | "battle-started" | "battle-ended"
    contestId: string
    timestamp: number
    data: {
        walletAddress?: string
        battleId?: string
        winner?: string
        [key: string]: any
    }
}

/**
 * Firebase Schema Structure:
 *
 * /contests/
 *   /{contestId}/
 *     /basicInfo - Contest metadata and status
 *     /participants/ - Participant data with deposits/content
 *       /{walletAddress}/
 *         - handle, role, deposits, contentPosts, battle info
 *     /battle/ - Battle-specific data
 *     /metrics/ - Real-time contest metrics
 *     /callbacks/ - Mini-app notification system
 *
 * /indexes/
 *   /contests-by-status/
 *     /created/{contestId}: ContestIndexData
 *     /awaiting_deposits/{contestId}: ContestIndexData
 *     /awaiting_content/{contestId}: ContestIndexData
 *     /active_battle/{contestId}: ContestIndexData
 *     /completed/{contestId}: ContestIndexData
 *
 *   /contests-by-participant/
 *     /{walletAddress}/
 *       /{contestId}: { role: "creator" | "participant", status: ContestStatus }
 *
 *   /contests-by-role/
 *     /creators/
 *       /{walletAddress}/
 *         /{contestId}: ContestIndexData
 *     /participants/
 *       /{walletAddress}/
 *         /{contestId}: ContestIndexData
 *
 *   /ongoing-contests/
 *     /{contestId}: {
 *       status: ContestStatus,
 *       lastUpdated: number,
 *       participants: string[]
 *     }
 *
 * /contest-stats/
 *   /global/
 *     - totalContests: number
 *     - activeContests: number
 *     - completedContests: number
 *     - lastUpdated: number
 *
 * /mini-app-cache/
 *   /ongoing-contest-data/
 *     /{walletAddress}: OngoingContestResponse
 *   /upcoming-contest-data/
 *     /{walletAddress}: UpcomingContestResponse[]
 */
