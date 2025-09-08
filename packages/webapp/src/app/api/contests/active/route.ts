import { NextResponse } from "next/server";
import { getActiveContest } from "@/lib/contest";

export async function GET() {
  try {
    const contest = await getActiveContest();

    if (!contest) {
      return NextResponse.json({
        success: true,
        contest: null,
        message: "No active contest found",
      });
    }

    return NextResponse.json({
      success: true,
      contest: {
        contestId: contest.contestId,
        name: contest.name,
        status: contest.status,
        participants: contest.participants.map((p) => ({
          handle: p.handle,
          walletAddress: p.walletAddress,
          zoraProfile: p.zoraProfile,
          zoraProfileData: p.zoraProfileData,
        })),
        createdAt: contest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error getting active contest:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
