import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth"
import { forfeitContest, getContestById } from "@/lib/contest"

async function handleForfeitContest(_request: NextRequest, { params }: { params: Promise<{ contestId: string }> }) {
    try {
        const { contestId } = await params

        // Check if contest exists
        const contest = await getContestById(contestId)
        if (!contest) {
            return NextResponse.json({ success: false, error: "Contest not found" }, { status: 404 })
        }

        // Forfeit the contest
        const success = await forfeitContest(contestId)

        if (success) {
            return NextResponse.json({
                success: true,
                message: `Contest ${contestId} marked as forfeited`,
            })
        } else {
            return NextResponse.json({ success: false, error: "Failed to forfeit contest" }, { status: 500 })
        }
    } catch (error) {
        console.error("Error forfeiting contest:", error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        )
    }
}

// Protected PATCH endpoint for forfeiting contests
export const PATCH = requireAdminAuth(handleForfeitContest)
