import { NextResponse } from "next/server"
import { getActiveContest, updateContestStatus } from "@/lib/contest"

export async function GET() {
    try {
        const contest = await getActiveContest()

        if (!contest) {
            return NextResponse.json({
                success: true,
                contest: null,
                message: "No active contest found",
            })
        }

        // Update contest status based on current time before returning
        await updateContestStatus(contest.contestId)
        
        // Fetch the contest again to get the updated status
        const updatedContest = await getActiveContest()
        
        if (!updatedContest) {
            return NextResponse.json({
                success: true,
                contest: null,
                message: "No active contest found",
            })
        }

        return NextResponse.json({
            success: true,
            contest: {
                contestId: updatedContest.contestId,
                name: updatedContest.name,
                status: updatedContest.status,
                participants: updatedContest.participants.map((p) => ({
                    handle: p.handle,
                    walletAddress: p.walletAddress,
                    zoraProfile: p.zoraProfile,
                    zoraProfileData: p.zoraProfileData,
                })),
                createdAt: updatedContest.createdAt,
                battleStartTime: updatedContest.battleStartTime,
                battleEndTime: updatedContest.battleEndTime,
                contentDeadline: updatedContest.contentDeadline,
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
