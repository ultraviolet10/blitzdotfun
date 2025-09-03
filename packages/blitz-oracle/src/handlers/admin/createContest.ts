import type { Contest, CreateContestInput } from "../create/types";
import { createFirebaseService } from "../../services/firebase";
import type { CloudflareBindings } from "../../types/env";
import { fetchZoraProfile } from "../../services/zora";

// Simple in-memory storage for now (will replace with Firebase later)
const contests = new Map<string, Contest>();

export async function createContest(
  input: CreateContestInput
): Promise<Contest> {
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
    status: "created",
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
    contentPosts: {
      [input.participantOne.walletAddress]: { detected: false },
      [input.participantTwo.walletAddress]: { detected: false },
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

export { contests };
