import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";

export interface ZoraProfileData {
  id?: string;
  handle?: string;
  displayName?: string;
  bio?: string;
  username?: string;
  website?: string;
  avatar?: {
    small?: string;
    medium?: string;
    blurhash?: string;
  };
  publicWallet?: {
    walletAddress?: string;
  };
  socialAccounts?: {
    instagram?: { username?: string; displayName?: string };
    tiktok?: { username?: string; displayName?: string };
    twitter?: { username?: string; displayName?: string };
    farcaster?: { username?: string; displayName?: string };
  };
  linkedWallets?: {
    edges?: Array<{
      node?: {
        walletType?: "PRIVY" | "EXTERNAL" | "SMART_WALLET";
        walletAddress?: string;
      };
    }>;
  };
  creatorCoin?: {
    address?: string;
    marketCap?: string;
    marketCapDelta24h?: string;
  };
}

export interface Contest {
  contestId: string;
  name: string;
  status: string;
  participantOne: {
    handle: string;
    walletAddress: string;
    zoraProfile?: string;
    zoraProfileData?: ZoraProfileData | null;
  };
  participantTwo: {
    handle: string;
    walletAddress: string;
    zoraProfile?: string;
    zoraProfileData?: ZoraProfileData | null;
  };
  contractAddress: string;
  createdAt: number;
  deposits: {
    [address: string]: {
      detected: boolean;
    };
  };
  contentPosts: {
    [address: string]: {
      detected: boolean;
    };
  };
}

export interface ContestsResponse {
  success: boolean;
  contests: Contest[];
}

export interface UseContestsReturn {
  contests: Contest[];
  loading: boolean;
  error: string | null;
  isParticipant: boolean;
  userContest: Contest | null;
  refetch: () => Promise<void>;
}

const BACKEND_URL = "http://localhost:3001";

export function useContests(): UseContestsReturn {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = usePrivy();

  const fetchContests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/battle/admin/contests`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch contests: ${response.status}`);
      }

      const data: ContestsResponse = await response.json();
      console.log("Fetched contests data:", data);

      if (!data.success) {
        throw new Error("Failed to fetch contests from API");
      }

      setContests(data.contests);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching contests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContests();
  }, []);

  const userWalletAddress = user?.linkedAccounts?.[0]?.smartWallets?.[0]?.address?.toLowerCase();

  const isParticipant = userWalletAddress
    ? contests.some(
        (contest) =>
          contest.participantOne.walletAddress.toLowerCase() ===
            userWalletAddress ||
          contest.participantTwo.walletAddress.toLowerCase() ===
            userWalletAddress
      )
    : false;

  // Find the contest where user is a participant
  const userContest = userWalletAddress
    ? contests.find(
        (contest) =>
          contest.participantOne.walletAddress.toLowerCase() ===
            userWalletAddress ||
          contest.participantTwo.walletAddress.toLowerCase() ===
            userWalletAddress
      ) || null
    : null;

  return {
    contests,
    loading,
    error,
    isParticipant,
    userContest,
    refetch: fetchContests,
  };
}
