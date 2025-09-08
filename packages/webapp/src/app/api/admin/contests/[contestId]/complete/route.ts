import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth"
import { completeContest, getContestById } from "@/lib/contest"

async function handleCompleteContest(_request: NextRequest, { params }: { params: Promise<{ contestId: string }> }) {
    try {
        const { contestId } = await params

        // Check if contest exists
        const contest = await getContestById(contestId)
        if (!contest) {
            return NextResponse.json({ success: false, error: "Contest not found" }, { status: 404 })
        }

        // Complete the contest
        const success = await completeContest(contestId)

        if (success) {
            return NextResponse.json({
                success: true,
                message: `Contest ${contestId} marked as completed`,
            })
        } else {
            return NextResponse.json({ success: false, error: "Failed to complete contest" }, { status: 500 })
        }
    } catch (error) {
        console.error("Error completing contest:", error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        )
    }
}

// Protected PATCH endpoint for completing contests
export const PATCH = requireAdminAuth(handleCompleteContest)
