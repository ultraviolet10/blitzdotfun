import type { Contest, CreateContestInput } from "../create/types"

// Simple in-memory storage for now (will replace with Firebase later)
const contests = new Map<string, Contest>()

export async function createContest(input: CreateContestInput): Promise<Contest> {
    const contestId = `${input.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`

    const contest: Contest = {
        contestId,
        name: input.name,
        status: "created",
        participantOne: input.participantOne,
        participantTwo: input.participantTwo,
        contractAddress: input.contractAddress,
        createdAt: Date.now(),
        deposits: {
            [input.participantOne.walletAddress]: { detected: false },
            [input.participantTwo.walletAddress]: { detected: false },
        },
        contentPosts: {
            [input.participantOne.walletAddress]: { detected: false },
            [input.participantTwo.walletAddress]: { detected: false },
        },
    }

    contests.set(contestId, contest)
    return contest
}

export async function getContest(contestId: string): Promise<Contest | null> {
    return contests.get(contestId) || null
}

export async function getAllContests(): Promise<Contest[]> {
    return Array.from(contests.values())
}

export { contests }
