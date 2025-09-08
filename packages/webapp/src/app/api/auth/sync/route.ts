import { type NextRequest, NextResponse } from "next/server"
import { type PrivyUser, syncPrivyUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
    try {
        const body: PrivyUser = await request.json()

        // Validate required fields
        if (!body.id || !body.createdAt) {
            return NextResponse.json({ error: "Missing required fields: id, createdAt" }, { status: 400 })
        }

        // Sync user data to database
        const user = await syncPrivyUser(body)

        return NextResponse.json({
            success: true,
            userId: user.id,
            message: "User synced successfully",
        })
    } catch (error) {
        console.error("Error syncing user:", error)

        return NextResponse.json(
            {
                error: "Failed to sync user data",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        )
    }
}
