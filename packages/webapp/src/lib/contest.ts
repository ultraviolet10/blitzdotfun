/**
 * CONTEST MANAGEMENT LIBRARY
 *
 * Core functions for managing contests in PostgreSQL database.
 * Uses Prisma for database operations with proper type safety.
 */

import { prisma } from "./prisma";
import type {
  Contest,
  ContestStatus,
  ContestParticipant,
} from "@prisma/client";
import { fetchZoraProfile } from "./zora";

// Extended types for contest operations
export interface ContestWithDetails extends Contest {
  participants: ContestParticipant[];
  deposits: Array<{
    id: string;
    walletAddress: string;
    detected: boolean;
    txHash?: string | null;
    timestamp?: Date | null;
  }>;
  contentPosts: Array<{
    id: string;
    walletAddress: string;
    detected: boolean;
    verified: boolean;
    zoraPostUrl?: string | null;
    timestamp?: Date | null;
  }>;
}

export interface CreateContestInput {
  name: string;
  participantOne: {
    handle: string;
    walletAddress: string;
    zoraProfile?: string;
  };
  participantTwo: {
    handle: string;
    walletAddress: string;
    zoraProfile?: string;
  };
  contractAddress: string;
}

/**
 * Create a new contest (only one active contest allowed at a time)
 */
export async function createContest(
  input: CreateContestInput
): Promise<ContestWithDetails> {
  // Check for existing active contests
  const activeContest = await getActiveContest();
  if (activeContest) {
    throw new Error(
      `Cannot create new contest. Active contest already exists: ${activeContest.contestId} (${activeContest.name})`
    );
  }

  const contestId = `${input.name
    .toLowerCase()
    .replace(/\s+/g, "-")}-${Date.now()}`;

  // Fetch Zora profile data for both participants
  const [participantOneProfile, participantTwoProfile] =
    await Promise.allSettled([
      fetchZoraProfile(input.participantOne.walletAddress),
      fetchZoraProfile(input.participantTwo.walletAddress),
    ]);

  // Extract profile data or null if failed
  const participantOneProfileData =
    participantOneProfile.status === "fulfilled"
      ? participantOneProfile.value
      : null;
  const participantTwoProfileData =
    participantTwoProfile.status === "fulfilled"
      ? participantTwoProfile.value
      : null;

  const contest = await prisma.contest.create({
    data: {
      contestId,
      name: input.name,
      status: "AWAITING_DEPOSITS",
      contractAddress: input.contractAddress,
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
  });

  return contest;
}

/**
 * Get the currently active contest (if any)
 * A contest is considered active if its status is not 'completed' or 'forfeited'
 */
export async function getActiveContest(): Promise<ContestWithDetails | null> {
  const contest = await prisma.contest.findFirst({
    where: {
      status: {
        notIn: ["COMPLETED", "FORFEITED"],
      },
    },
    include: {
      participants: true,
      deposits: true,
      contentPosts: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return contest;
}

/**
 * Get contest by ID
 */
export async function getContestById(
  contestId: string
): Promise<ContestWithDetails | null> {
  const contest = await prisma.contest.findUnique({
    where: { contestId },
    include: {
      participants: true,
      deposits: true,
      contentPosts: true,
    },
  });

  return contest;
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
  });

  return contests;
}

/**
 * Mark a contest as completed, allowing new contests to be created
 */
export async function completeContest(contestId: string): Promise<boolean> {
  try {
    await prisma.contest.update({
      where: { contestId },
      data: { status: "COMPLETED" as ContestStatus },
    });
    return true;
  } catch (error) {
    console.error("Error completing contest:", error);
    return false;
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
    });
    return true;
  } catch (error) {
    console.error("Error forfeiting contest:", error);
    return false;
  }
}

/**
 * Check if user is a participant in the active contest
 */
export async function isUserContestParticipant(walletAddress: string): Promise<{
  isParticipant: boolean;
  contest: ContestWithDetails | null;
  participantRole?: "participant_one" | "participant_two";
}> {
  const contest = await getActiveContest();

  if (!contest) {
    return { isParticipant: false, contest: null };
  }

  const participant = contest.participants.find(
    (p) => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );

  if (!participant) {
    return { isParticipant: false, contest };
  }

  // Determine role based on order (first participant is participant_one)
  const participantRole =
    contest.participants[0].walletAddress.toLowerCase() ===
    walletAddress.toLowerCase()
      ? ("participant_one" as const)
      : ("participant_two" as const);

  return {
    isParticipant: true,
    contest,
    participantRole,
  };
}

/**
 * Get contest status formatted for frontend
 */
export async function getContestStatus(contestId?: string) {
  const contest = contestId
    ? await getContestById(contestId)
    : await getActiveContest();

  if (!contest) {
    return null;
  }

  const participants = contest.participants;
  const deposits = contest.deposits;
  const contentPosts = contest.contentPosts;

  const allDepositsReceived = deposits.every((d) => d.detected);
  const allContentSubmitted = contentPosts.every((c) => c.detected);

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
            deposits.find(
              (d) => d.walletAddress === participants[0].walletAddress
            )?.detected || false,
          timestamp: deposits.find(
            (d) => d.walletAddress === participants[0].walletAddress
          )?.timestamp,
        },
        contentStatus: {
          detected:
            contentPosts.find(
              (c) => c.walletAddress === participants[0].walletAddress
            )?.detected || false,
          verified:
            contentPosts.find(
              (c) => c.walletAddress === participants[0].walletAddress
            )?.verified || false,
          timestamp: contentPosts.find(
            (c) => c.walletAddress === participants[0].walletAddress
          )?.timestamp,
          zoraPostUrl: contentPosts.find(
            (c) => c.walletAddress === participants[0].walletAddress
          )?.zoraPostUrl,
        },
      },
      two: {
        handle: participants[1].handle,
        walletAddress: participants[1].walletAddress,
        depositStatus: {
          detected:
            deposits.find(
              (d) => d.walletAddress === participants[1].walletAddress
            )?.detected || false,
          timestamp: deposits.find(
            (d) => d.walletAddress === participants[1].walletAddress
          )?.timestamp,
        },
        contentStatus: {
          detected:
            contentPosts.find(
              (c) => c.walletAddress === participants[1].walletAddress
            )?.detected || false,
          verified:
            contentPosts.find(
              (c) => c.walletAddress === participants[1].walletAddress
            )?.verified || false,
          timestamp: contentPosts.find(
            (c) => c.walletAddress === participants[1].walletAddress
          )?.timestamp,
          zoraPostUrl: contentPosts.find(
            (c) => c.walletAddress === participants[1].walletAddress
          )?.zoraPostUrl,
        },
      },
    },
    progress: {
      allDepositsReceived,
      allContentSubmitted,
      readyForBattle: contest.status === "ACTIVE_BATTLE",
    },
    deadlines: {
      deposit: contest.depositDeadline,
      content: contest.contentDeadline,
      battleEnd: contest.battleEndTime,
    },
    createdAt: contest.createdAt,
    lastUpdated: new Date(),
  };
}
