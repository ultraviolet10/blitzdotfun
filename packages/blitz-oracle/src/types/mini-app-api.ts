import type { Address } from "viem"
import type { ContestStatus } from "../handlers/create/types"

/**
 * Mini-app specific API types and responses
 * Based on Figma designs and user flow requirements
 */

// Mini-app endpoint request/response types
export interface GetOngoingContestRequest {
    walletAddress: Address
}

export interface GetOngoingContestResponse {
    success: boolean
    data?: OngoingContestData
    userRole: "creator" | "participant" | "spectator"
    message?: string
}

export interface OngoingContestData {
    contestId: string
    name: string
    status: ContestStatus

    // Contest participants
    participants: ContestParticipantData[]

    // User-specific data
    userParticipant?: ContestParticipantData
    isUserCreator: boolean
    isUserParticipant: boolean

    // Contest progress
    progress: {
        depositsCompleted: number
        totalParticipants: number
        contentSubmitted: number
        readyForBattle: boolean
    }

    // Deposit requirements (for welcome screen)
    depositRequirement?: {
        tokenAmount: number // tokens worth $500
        prizeAmount: string // "$500"
        contractAddress: Address
    }

    // Battle data (for battle screen)
    battle?: {
        battleId: string
        isActive: boolean
        startTime: number
        endTime: number
        timeRemaining: number

        // Creator coins in battle
        creatorOneCoin?: Address
        creatorTwoCoin?: Address

        // Metrics
        totalVolume: number
        totalVotes: number

        // User-specific battle data
        userCanPurchase: boolean
        purchaseRedirectUrl?: string
    }

    // Next action for user
    nextAction: {
        type: "deposit" | "content" | "wait" | "battle" | "completed"
        message: string
        deadline?: number
    }
}

export interface ContestParticipantData {
    handle: string
    walletAddress: Address
    zoraProfile?: string
    role: "creator" | "participant"

    // Status tracking
    hasDeposited: boolean
    hasSubmittedContent: boolean

    // Deposit info
    depositInfo?: {
        txHash: string
        timestamp: number
        amountDeposited: string
    }

    // Content info
    contentInfo?: {
        zoraPostUrl: string
        contentCoinAddress?: Address
        timestamp: number
        hasBlitzTag: boolean
    }

    // Battle participation
    battleInfo?: {
        votesReceived: number
        canPurchaseOwn: boolean // always false for creators
        purchaseUrl?: string
    }
}

// Upcoming contests response (for participants)
export interface GetUpcomingContestsResponse {
    success: boolean
    contests: UpcomingContestData[]
}

export interface UpcomingContestData {
    contestId: string
    name: string
    status: ContestStatus

    participants: {
        handle: string
        walletAddress: Address
        zoraProfile?: string
    }[]

    timeline: {
        depositDeadline?: number
        contentDeadline?: number
        battleStartTime?: number
    }

    userRole: "creator" | "participant" | "spectator"
}

// Callback/notification types for mini-app
export interface ContestNotification {
    type: "deposit_success" | "content_submitted" | "battle_started" | "contest_complete"
    contestId: string
    message: string
    timestamp: number

    // Type-specific data
    data?: {
        // For deposit_success
        walletAddress?: Address
        txHash?: string

        // For content_submitted
        zoraPostUrl?: string
        contentCoinAddress?: Address

        // For battle_started
        battleId?: string
        battleEndTime?: number

        // For contest_complete
        winner?: Address
        winnerHandle?: string
    }
}

// Mini-app user state management
export interface UserContestState {
    walletAddress: Address

    // Active participation
    activeContests: {
        contestId: string
        role: "creator" | "participant"
        status: ContestStatus
        nextAction: string
    }[]

    // Contest history
    completedContests: {
        contestId: string
        role: "creator" | "participant"
        result: "won" | "lost" | "forfeited"
        timestamp: number
    }[]

    // Pending actions
    pendingActions: {
        contestId: string
        action: "deposit" | "content" | "wait"
        deadline?: number
    }[]
}

// Screen-specific data structures
export interface WelcomeScreenData {
    contestId: string
    competitorData: {
        participants: ContestParticipantData[]
        userIsCompetitor: boolean
        userCompetitor?: ContestParticipantData
    }
    depositRequirement: {
        tokenAmount: number
        prizeAmount: string
        contractAddress: Address
    }
}

export interface PreBattleScreenData {
    contestId: string
    name: string
    participants: ContestParticipantData[]
    timeline: {
        depositDeadline?: number
        contentDeadline?: number
        battleStartTime?: number
    }
    userRole: "participant" // only participants see this screen
}

export interface PostContentScreenData {
    contestId: string
    message: string
    zoraUrl: string
    requiredTag: string // "blitzdotfun"
    deadline?: number
}

export interface BattleScreenData {
    contestId: string
    battleId: string

    participants: {
        handle: string
        walletAddress: Address
        contentCoinAddress?: Address
        votesReceived: number
        canPurchase: boolean
        purchaseUrl?: string
    }[]

    battle: {
        isActive: boolean
        timeRemaining: number
        totalVolume: number
        totalVotes: number
    }

    userRole: "creator" | "participant" | "spectator"
    userCanParticipate: boolean
}

// API endpoint paths for mini-app
export const MINI_APP_ENDPOINTS = {
    GET_ONGOING_CONTEST: "/mini-app/get-ongoing-contest",
    GET_UPCOMING_CONTESTS: "/mini-app/get-upcoming-contests",
    GET_USER_STATE: "/mini-app/user-state",
    NOTIFY_DEPOSIT_SUCCESS: "/mini-app/notify-deposit",
    NOTIFY_CONTENT_SUBMITTED: "/mini-app/notify-content",
    GET_BATTLE_DATA: "/mini-app/battle-data",
} as const
