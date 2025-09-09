/**
 * CONTEST MANAGEMENT LIBRARY
 *
 * Core functions for managing contests in PostgreSQL database.
 * Uses Prisma for database operations with proper type safety.
 */

import type { Contest, ContestParticipant, ContestStatus } from "@prisma/client"
import { prisma } from "./prisma"
import { fetchZoraProfile } from "./zora"

// Extended types for contest operations
export interface ContestWithDetails extends Contest {
    participants: ContestParticipant[]
    deposits: Array<{
        id: string
        walletAddress: string
        detected: boolean
        txHash?: string | null
        timestamp?: Date | null
    }>
    contentPosts: Array<{
        id: string
        walletAddress: string
        detected: boolean
        verified: boolean
        zoraPostUrl?: string | null
        timestamp?: Date | null
    }>
}

export interface CreateContestInput {
    name: string
    participantOne: {
        handle: string
        walletAddress: string
        zoraProfile?: string
    }
    participantTwo: {
        handle: string
        walletAddress: string
        zoraProfile?: string
    }
    contractAddress: string
}

/**
 * Create a new contest (only one active contest allowed at a time)
 */
export async function createContest(input: CreateContestInput): Promise<ContestWithDetails> {
    // Check for existing active contests (not completed/forfeited)
    const hasActive = await hasActiveContest()
    if (hasActive) {
        const activeContest = await prisma.contest.findFirst({
            where: {
                status: {
                    notIn: ["COMPLETED", "FORFEITED"],
                },
            },
        })
        throw new Error(
            `Cannot create new contest. Active contest already exists: ${activeContest?.contestId} (${activeContest?.name})`,
        )
    }

    const contestId = `${input.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`

    // Fetch Zora profile data for both participants
    const [participantOneProfile, participantTwoProfile] = await Promise.allSettled([
        fetchZoraProfile(input.participantOne.walletAddress),
        fetchZoraProfile(input.participantTwo.walletAddress),
    ])

    // Extract profile data or null if failed
    const participantOneProfileData = participantOneProfile.status === "fulfilled" ? participantOneProfile.value : null
    const participantTwoProfileData = participantTwoProfile.status === "fulfilled" ? participantTwoProfile.value : null

    // Set contest timers - 1 hour from creation for battle start
    const now = new Date()
    const battleStartTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
    const battleEndTime = new Date(battleStartTime.getTime() + 2 * 60 * 60 * 1000) // 2 hours after battle starts

    const contest = await prisma.contest.create({
        data: {
            contestId,
            name: input.name,
            status: "AWAITING_DEPOSITS",
            contractAddress: input.contractAddress,
            battleStartTime, // When the battle begins (1 hour from creation)
            battleEndTime, // When the battle ends (3 hours from creation)
            contentDeadline: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes for content submission
            participants: {
                create: [
                    {
                        handle: input.participantOne.handle,
                        walletAddress: input.participantOne.walletAddress,
                        zoraProfile: input.participantOne.zoraProfile,
                        zoraProfileData: participantOneProfileData
                            ? JSON.parse(JSON.stringify(participantOneProfileData))
                            : undefined,
                    },
                    {
                        handle: input.participantTwo.handle,
                        walletAddress: input.participantTwo.walletAddress,
                        zoraProfile: input.participantTwo.zoraProfile,
                        zoraProfileData: participantTwoProfileData
                            ? JSON.parse(JSON.stringify(participantTwoProfileData))
                            : undefined,
                    },
                ],
            },
            deposits: {
                create: [
                    {
                        walletAddress: input.participantOne.walletAddress,
                        detected: false,
                    },
                    {
                        walletAddress: input.participantTwo.walletAddress,
                        detected: false,
                    },
                ],
            },
            contentPosts: {
                create: [
                    {
                        walletAddress: input.participantOne.walletAddress,
                        detected: false,
                        verified: false,
                    },
                    {
                        walletAddress: input.participantTwo.walletAddress,
                        detected: false,
                        verified: false,
                    },
                ],
            },
        },
        include: {
            participants: true,
            deposits: true,
            contentPosts: true,
        },
    })

    return contest
}

/**
 * Get the current contest (active or recently completed)
 * Returns the most recent contest, including completed/forfeited ones for winner display
 * Ensures only one active contest exists at a time for contest creation logic
 */
export async function getActiveContest(): Promise<ContestWithDetails | null> {
    const contest = await prisma.contest.findFirst({
        include: {
            participants: true,
            deposits: true,
            contentPosts: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return contest
}

/**
 * Check if there's currently an active contest (not completed/forfeited)
 * Used for preventing multiple active contests
 */
export async function hasActiveContest(): Promise<boolean> {
    const activeContest = await prisma.contest.findFirst({
        where: {
            status: {
                notIn: ["COMPLETED", "FORFEITED"],
            },
        },
    })

    return activeContest !== null
}

/**
 * Get contest by ID
 */
export async function getContestById(contestId: string): Promise<ContestWithDetails | null> {
    const contest = await prisma.contest.findUnique({
        where: { contestId },
        include: {
            participants: true,
            deposits: true,
            contentPosts: true,
        },
    })

    return contest
}

/**
 * Get all contests
 */
export async function getAllContests(): Promise<ContestWithDetails[]> {
    const contests = await prisma.contest.findMany({
        include: {
            participants: true,
            deposits: true,
            contentPosts: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return contests
}

/**
 * Mark a contest as completed, allowing new contests to be created
 */
export async function completeContest(contestId: string): Promise<boolean> {
    try {
        await prisma.contest.update({
            where: { contestId },
            data: { status: "COMPLETED" as ContestStatus },
        })
        return true
    } catch (error) {
        console.error("Error completing contest:", error)
        return false
    }
}

/**
 * Mark a contest as forfeited, allowing new contests to be created
 */
export async function forfeitContest(contestId: string): Promise<boolean> {
    try {
        await prisma.contest.update({
            where: { contestId },
            data: { status: "FORFEITED" as ContestStatus },
        })
        return true
    } catch (error) {
        console.error("Error forfeiting contest:", error)
        return false
    }
}

/**
 * Check if user is a participant in the active contest
 */
export async function isUserContestParticipant(walletAddress: string): Promise<{
    isParticipant: boolean
    contest: ContestWithDetails | null
    participantRole?: "participant_one" | "participant_two"
}> {
    const contest = await getActiveContest()

    if (!contest) {
        return { isParticipant: false, contest: null }
    }

    const participant = contest.participants.find((p) => p.walletAddress.toLowerCase() === walletAddress.toLowerCase())

    if (!participant) {
        return { isParticipant: false, contest }
    }

    // Determine role based on order (first participant is participant_one)
    const participantRole =
        contest.participants[0].walletAddress.toLowerCase() === walletAddress.toLowerCase()
            ? ("participant_one" as const)
            : ("participant_two" as const)

    return {
        isParticipant: true,
        contest,
        participantRole,
    }
}

/**
 * Get contest status formatted for frontend
 */
export async function getContestStatus(contestId?: string) {
    const contest = contestId ? await getContestById(contestId) : await getActiveContest()

    if (!contest) {
        return null
    }

    const participants = contest.participants
    const deposits = contest.deposits
    const contentPosts = contest.contentPosts

    const allDepositsReceived = deposits.every((d) => d.detected)
    const allContentSubmitted = contentPosts.every((c) => c.detected)

    return {
        contestId: contest.contestId,
        name: contest.name,
        status: contest.status,
        participants: {
            one: {
                handle: participants[0].handle,
                walletAddress: participants[0].walletAddress,
                depositStatus: {
                    detected:
                        deposits.find((d) => d.walletAddress === participants[0].walletAddress)?.detected || false,
                    timestamp: deposits.find((d) => d.walletAddress === participants[0].walletAddress)?.timestamp,
                },
                contentStatus: {
                    detected:
                        contentPosts.find((c) => c.walletAddress === participants[0].walletAddress)?.detected || false,
                    verified:
                        contentPosts.find((c) => c.walletAddress === participants[0].walletAddress)?.verified || false,
                    timestamp: contentPosts.find((c) => c.walletAddress === participants[0].walletAddress)?.timestamp,
                    zoraPostUrl: contentPosts.find((c) => c.walletAddress === participants[0].walletAddress)
                        ?.zoraPostUrl,
                },
            },
            two: {
                handle: participants[1].handle,
                walletAddress: participants[1].walletAddress,
                depositStatus: {
                    detected:
                        deposits.find((d) => d.walletAddress === participants[1].walletAddress)?.detected || false,
                    timestamp: deposits.find((d) => d.walletAddress === participants[1].walletAddress)?.timestamp,
                },
                contentStatus: {
                    detected:
                        contentPosts.find((c) => c.walletAddress === participants[1].walletAddress)?.detected || false,
                    verified:
                        contentPosts.find((c) => c.walletAddress === participants[1].walletAddress)?.verified || false,
                    timestamp: contentPosts.find((c) => c.walletAddress === participants[1].walletAddress)?.timestamp,
                    zoraPostUrl: contentPosts.find((c) => c.walletAddress === participants[1].walletAddress)
                        ?.zoraPostUrl,
                },
            },
        },
        progress: {
            allDepositsReceived,
            allContentSubmitted,
            readyForBattle: contest.status === "ACTIVE_BATTLE",
        },
        deadlines: {
            content: contest.contentDeadline,
            battleStart: contest.battleStartTime,
            battleEnd: contest.battleEndTime,
        },
        createdAt: contest.createdAt,
        lastUpdated: new Date(),
    }
}

// Function to check and update contest status based on timing
export async function updateContestStatus(contestId: string) {
    const contest = await prisma.contest.findUnique({
        where: { contestId },
        include: {
            participants: true,
            deposits: true,
            contentPosts: true,
        },
    })

    if (!contest) {
        throw new Error("Contest not found")
    }

    const now = new Date()
    let newStatus = contest.status

    // Check if battle should start
    if (
        contest.battleStartTime &&
        now >= contest.battleStartTime &&
        (contest.status === "AWAITING_DEPOSITS" || contest.status === "AWAITING_CONTENT")
    ) {
        newStatus = "ACTIVE_BATTLE"
    }

    // Check if battle should end
    if (
        contest.battleEndTime &&
        now >= contest.battleEndTime &&
        contest.status === "ACTIVE_BATTLE"
    ) {
        newStatus = "COMPLETED"
    }

    // Update status if it changed
    if (newStatus !== contest.status) {
        await prisma.contest.update({
            where: { contestId },
            data: { status: newStatus },
        })
    }

    return newStatus
}

// Function to get contest with updated status
export async function getContestWithUpdatedStatus(contestId: string) {
    // First update the status
    await updateContestStatus(contestId)
    
    // Then fetch the updated contest
    return await prisma.contest.findUnique({
        where: { contestId },
        include: {
            participants: true,
            deposits: true,
            contentPosts: true,
        },
    })
}

/**
 * Manually update contest status (admin function)
 */
export async function updateContestStatusManually(contestId: string, status: ContestStatus): Promise<ContestWithDetails> {
    const updateData: { status: ContestStatus; battleStartTime?: Date } = { status }
    
    // Reset timer when status changes to ACTIVE_BATTLE
    if (status === 'ACTIVE_BATTLE') {
        updateData.battleStartTime = new Date()
    }
    
    const contest = await prisma.contest.update({
        where: { contestId },
        data: updateData,
        include: {
            participants: true,
            deposits: true,
            contentPosts: true,
        },
    })

    return contest
}
