import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import {
  type CreateContestInput,
  createContest,
  getAllContests,
} from "@/lib/contest";

async function handleCreateContest(request: NextRequest) {
  try {
    const body: CreateContestInput = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.participantOne ||
      !body.participantTwo ||
      !body.contractAddress
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, participantOne, participantTwo, contractAddress",
        },
        { status: 400 }
      );
    }

    // Validate participants
    if (!body.participantOne.handle || !body.participantOne.walletAddress) {
      return NextResponse.json(
        { error: "participantOne must have handle and walletAddress" },
        { status: 400 }
      );
    }

    if (!body.participantTwo.handle || !body.participantTwo.walletAddress) {
      return NextResponse.json(
        { error: "participantTwo must have handle and walletAddress" },
        { status: 400 }
      );
    }

    // Create contest
    const contest = await createContest(body);

    return NextResponse.json({
      success: true,
      contest: {
        contestId: contest.contestId,
        name: contest.name,
        status: contest.status,
        participants: contest.participants,
        createdAt: contest.createdAt,
        battleStartTime: contest.battleStartTime,
        battleEndTime: contest.battleEndTime,
        contentDeadline: contest.contentDeadline,
      },
    });
  } catch (error) {
    console.error("Error creating contest:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleGetContests() {
  try {
    const contests = await getAllContests();

    return NextResponse.json({
      success: true,
      contests: contests.map((contest) => ({
        contestId: contest.contestId,
        name: contest.name,
        status: contest.status,
        participants: contest.participants,
        createdAt: contest.createdAt,
        updatedAt: contest.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error getting contests:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Protected POST endpoint for creating contests
export const POST = requireAdminAuth(handleCreateContest);

// Protected GET endpoint for listing all contests
export const GET = requireAdminAuth(handleGetContests);
