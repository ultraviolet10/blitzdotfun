import { NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/admin-auth"
import { updateContestStatusManually } from "@/lib/contest"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ contestId: string }> }
) {
    try {
        // Authenticate admin
        const authResult = await authenticateAdmin(request)
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: 401 }
            )
        }

        const { contestId } = await params
        const body = await request.json()
        const { status } = body

        // Validate status
        const validStatuses = [
            'AWAITING_DEPOSITS',
            'AWAITING_CONTENT', 
            'ACTIVE_BATTLE',
            'COMPLETED',
            'FORFEITED'
        ]

        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
                },
                { status: 400 }
            )
        }

        // Update contest status
        const updatedContest = await updateContestStatusManually(contestId, status)

        return NextResponse.json({
            success: true,
            contest: updatedContest,
            message: `Contest status updated to ${status}`
        })

    } catch (error) {
        console.error("Error updating contest status:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        )
    }
}
