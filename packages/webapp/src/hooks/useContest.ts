/**
 * CONTEST HOOK
 *
 * Hook for managing contest state and checking user participation.
 * Integrates with the compound user state system.
 */

import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { compoundUserAtom } from "@/atoms/userAtoms";
import type { ZoraProfileData } from "@/lib/zora";

interface Contest {
  contestId: string;
  name: string;
  status: string;
  participants: Array<{
    handle: string;
    walletAddress: string;
    zoraProfile?: string;
    zoraProfileData?: ZoraProfileData | null;
  }>;
  createdAt: string;
}

interface ContestParticipation {
  isParticipant: boolean;
  contest: Contest | null;
  participantRole?: "participant_one" | "participant_two";
  loading: boolean;
  error: string | null;
}

export function useContest() {
  const [blitzUser] = useAtom(compoundUserAtom);
  const [contestState, setContestState] = useState<ContestParticipation>({
    isParticipant: false,
    contest: null,
    loading: false,
    error: null,
  });

  const checkContestParticipation = useCallback(async () => {
    if (!blitzUser.auth.walletAddress) {
      setContestState({
        isParticipant: false,
        contest: null,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      setContestState((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch active contest
      const response = await fetch("/api/contests/active");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch contest");
      }

      if (!data.contest) {
        setContestState({
          isParticipant: false,
          contest: null,
          loading: false,
          error: null,
        });
        return;
      }

      const contest = data.contest;
      const userWallet = blitzUser.auth.walletAddress.toLowerCase();

      // Check if user is a participant
      const participantIndex = contest.participants.findIndex(
        (p: { walletAddress: string }) =>
          p.walletAddress.toLowerCase() === userWallet
      );

      if (participantIndex === -1) {
        setContestState({
          isParticipant: false,
          contest,
          loading: false,
          error: null,
        });
        return;
      }

      const participantRole =
        participantIndex === 0 ? "participant_one" : "participant_two";

      setContestState({
        isParticipant: true,
        contest,
        participantRole,
        loading: false,
        error: null,
      });
    } catch (error) {
      setContestState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [blitzUser.auth.walletAddress]);

  // Check contest participation when wallet address changes
  useEffect(() => {
    checkContestParticipation();
  }, [checkContestParticipation]);

  return {
    ...contestState,
    refetch: checkContestParticipation,
  };
}
