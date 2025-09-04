import type {
  Contest,
  CreateContestInput,
  ContestStatus,
} from "../create/types";
import { createFirebaseService } from "../../services/firebase";
import type { CloudflareBindings } from "../../types/env";
import { fetchZoraProfile } from "../../services/zora";

// Simple in-memory storage for now (will replace with Firebase later)
const contests = new Map<string, Contest>();

export async function createContest(
  input: CreateContestInput,
  env?: CloudflareBindings
): Promise<Contest> {
  // Check for existing active contests before creating a new one
  const activeContest = await getActiveContest(env);
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

  const contest: Contest = {
    contestId,
    name: input.name,
    status: "awaiting_deposits",
    participantOne: {
      ...input.participantOne,
      zoraProfileData: participantOneProfileData,
    },
    participantTwo: {
      ...input.participantTwo,
      zoraProfileData: participantTwoProfileData,
    },
    contractAddress: input.contractAddress,
    createdAt: Date.now(),
    deposits: {
      [input.participantOne.walletAddress]: { detected: false },
      [input.participantTwo.walletAddress]: { detected: false },
    },
    contentStatus: {
      [input.participantOne.walletAddress]: { detected: false, verified: false },
      [input.participantTwo.walletAddress]: { detected: false, verified: false },
    },
  };

  contests.set(contestId, contest);
  return contest;
}

export async function getContest(
  contestId: string,
  env: CloudflareBindings
): Promise<Contest | null> {
  // Firebase Admin SDK is not compatible with Cloudflare Workers
  // Use in-memory storage for now
  return contests.get(contestId) || null;
}

export async function getAllContests(
  env: CloudflareBindings
): Promise<Contest[]> {
  try {
    // Try Firebase first with timeout protection
    const firebasePromise = (async () => {
      const firebaseService = createFirebaseService(env);
      const contestsData = await firebaseService.readData<{
        [key: string]: Contest;
      }>("contests");

      if (contestsData) {
        // Convert Firebase object to array and update in-memory cache
        const contestsArray = Object.values(contestsData);

        // Update in-memory cache
        contestsArray.forEach((contest) => {
          contests.set(contest.contestId, contest);
        });

        return contestsArray;
      }

      return null;
    })();

    // 10-second timeout for Firebase operations
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(
        () => reject(new Error("Firebase read timeout after 10s")),
        10000
      );
    });

    const result = await Promise.race([firebasePromise, timeoutPromise]);

    if (result) {
      return result;
    }

    // If no data in Firebase, return in-memory contests
    console.log("No data in Firebase, using in-memory storage");
    return Array.from(contests.values());
  } catch (error) {
    console.error(
      "Error getting all contests (falling back to in-memory):",
      error
    );
    // Fallback to in-memory storage
    return Array.from(contests.values());
  }
}

/**
 * Get the currently active contest (if any)
 * A contest is considered active if its status is not 'completed' or 'forfeited'
 */
export async function getActiveContest(
  env?: CloudflareBindings
): Promise<Contest | null> {
  try {
    const allContests = await getAllContests(env || ({} as CloudflareBindings));

    // Find contests that are not completed or forfeited
    const activeContests = allContests.filter(
      (contest) =>
        contest.status !== "completed" && contest.status !== "forfeited"
    );

    // Return the most recent active contest (if any)
    if (activeContests.length > 0) {
      return activeContests.sort((a, b) => b.createdAt - a.createdAt)[0];
    }

    return null;
  } catch (error) {
    console.error("Error getting active contest:", error);
    return null;
  }
}

/**
 * Mark a contest as completed, allowing new contests to be created
 */
export async function completeContest(
  contestId: string,
  env: CloudflareBindings
): Promise<boolean> {
  try {
    const contest = await getContest(contestId, env);
    if (!contest) {
      throw new Error(`Contest ${contestId} not found`);
    }

    contest.status = "completed";
    contests.set(contestId, contest);

    // Update in Firebase if available
    try {
      const firebaseService = createFirebaseService(env);
      await firebaseService.updateData(`contests/${contestId}`, {
        status: "completed",
      });
    } catch (firebaseError) {
      console.warn(
        "Failed to update contest status in Firebase:",
        firebaseError
      );
    }

    return true;
  } catch (error) {
    console.error("Error completing contest:", error);
    return false;
  }
}

/**
 * Mark a contest as forfeited, allowing new contests to be created
 */
export async function forfeitContest(
  contestId: string,
  env: CloudflareBindings
): Promise<boolean> {
  try {
    const contest = await getContest(contestId, env);
    if (!contest) {
      throw new Error(`Contest ${contestId} not found`);
    }

    contest.status = "forfeited";
    contests.set(contestId, contest);

    // Update in Firebase if available
    try {
      const firebaseService = createFirebaseService(env);
      await firebaseService.updateData(`contests/${contestId}`, {
        status: "forfeited",
      });
    } catch (firebaseError) {
      console.warn(
        "Failed to update contest status in Firebase:",
        firebaseError
      );
    }

    return true;
  } catch (error) {
    console.error("Error forfeiting contest:", error);
    return false;
  }
}

export { contests };
