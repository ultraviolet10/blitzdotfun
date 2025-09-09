import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth"
import { getActiveContest } from "@/lib/contest"

async function handleGetActiveContest() {
    try {
        const contest = await getActiveContest()

        if (!contest) {
            return NextResponse.json({
                success: true,
                contest: null,
                message: "No active contest found",
            })
        }

        return NextResponse.json({
            success: true,
            contest: {
                id: contest.id,
                contestId: contest.contestId,
                name: contest.name,
                status: contest.status,
                participants: contest.participants,
                deposits: contest.deposits,
                contentPosts: contest.contentPosts,
                createdAt: contest.createdAt,
                updatedAt: contest.updatedAt,
                battleStartTime: contest.battleStartTime,
                battleEndTime: contest.battleEndTime,
                contentDeadline: contest.contentDeadline,
                contractAddress: contest.contractAddress,
            },
        })
    } catch (error) {
        console.error("Error getting active contest:", error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        )
    }
}

// Protected GET endpoint for getting active contest
export const GET = requireAdminAuth(handleGetActiveContest)
