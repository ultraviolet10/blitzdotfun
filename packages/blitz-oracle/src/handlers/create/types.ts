import type { Address, Hex } from "viem"

export type CreateBattleInput = {
    creatorOneWallet: Address
    creatorTwoWallet: Address
    creatorOneCoin: Address
    creatorTwoCoin: Address
}

export type CreateBattleOutput = {
    battleId: Hex
}

// Contest flow types
export type ContestStatus =
    | "created"
    | "awaiting_deposits"
    | "awaiting_content"
    | "active_battle"
    | "completed"
    | "forfeited"

export interface ZoraProfileData {
    id?: string
    handle?: string
    displayName?: string
    bio?: string
    username?: string
    website?: string
    avatar?: {
        small?: string
        medium?: string
        blurhash?: string
    }
    publicWallet?: {
        walletAddress?: string
    }
    socialAccounts?: {
        instagram?: { username?: string; displayName?: string }
        tiktok?: { username?: string; displayName?: string }
        twitter?: { username?: string; displayName?: string }
        farcaster?: { username?: string; displayName?: string }
    }
    linkedWallets?: {
        edges?: Array<{
            node?: {
                walletType?: "PRIVY" | "EXTERNAL" | "SMART_WALLET"
                walletAddress?: string
            }
        }>
    }
    creatorCoin?: {
        address?: string
        marketCap?: string
        marketCapDelta24h?: string
    }
}

export interface ContestParticipant {
    handle: string
    walletAddress: Address
    zoraProfile?: string
    zoraProfileData?: ZoraProfileData | null
}

export interface DepositStatus {
    detected: boolean
    txHash?: string
    timestamp?: number
}

export interface ContentPost {
    zoraPostUrl?: string
    timestamp?: number
    detected: boolean
}

export interface ContestMetrics {
    participantOneVotes: number
    participantTwoVotes: number
    lastUpdated: number
}

export interface Contest {
    contestId: string
    name: string
    status: ContestStatus
    participantOne: ContestParticipant
    participantTwo: ContestParticipant
    contractAddress: Address
    createdAt: number
    depositDeadline?: number
    contentDeadline?: number
    battleEndTime?: number
    deposits: Record<string, DepositStatus>
    contentPosts: Record<string, ContentPost>
    battleId?: string
    metrics?: ContestMetrics
}

export interface CreateContestInput {
    name: string
    participantOne: ContestParticipant
    participantTwo: ContestParticipant
    contractAddress: Address
}
