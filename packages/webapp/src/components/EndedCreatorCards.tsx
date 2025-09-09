"use client";

import { useState, useEffect } from "react";
import { useContest } from "@/hooks/useContest";
import { getCreatorCoinsByAddress } from "@/lib/getCreatorCoins";
import { GetProfileCoinsResponse } from "@zoralabs/coins-sdk";
import arrowUp from "@/assets/arrow_up.svg";
import arrowDown from "@/assets/arrow_down.svg";
import VsZorb from "@/assets/vs_zorb.svg";
import Image from "next/image";

const formatMarketCap = (value: string) => {
  const num = parseFloat(value);
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(0)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${num.toFixed(0)}`;
};

interface CreatorProfile {
  displayName?: string;
  handle?: string;
  avatar?: {
    small?: string;
    medium?: string;
  };
}

type EndedCreatorCardProps = {
  creatorAddress: string;
  isWinner: boolean;
  finalScore: number;
  creatorProfile?: CreatorProfile | null;
};

function EndedCreatorCard({
  creatorAddress,
  isWinner,
  finalScore,
  creatorProfile,
}: EndedCreatorCardProps) {
  const [coinsData, setCoinsData] = useState<GetProfileCoinsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCreatorData() {
      if (!creatorAddress) {
        setError("No address available");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const coins = await getCreatorCoinsByAddress(creatorAddress, 10);
        setCoinsData(coins);
      } catch (err) {
        console.error("Error loading creator coins:", err);
        setError("Failed to load creator data");
      } finally {
        setLoading(false);
      }
    }

    loadCreatorData();
  }, [creatorAddress]);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="space-y-4 mb-6">
          <div
            className="border rounded-2xl p-4 animate-pulse"
            style={{
              background: "rgba(166, 236, 156, 0.1)",
              borderColor: "#A6EC9C",
            }}
          >
            <div
              className="h-20 rounded"
              style={{ background: "rgba(184, 239, 146, 0.2)" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !creatorProfile) {
    return (
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: "#124D04" }}>
            Creator Battle Ended
          </h2>
          <div
            className="border border-red-300 rounded-lg p-3"
            style={{ background: "rgba(252, 165, 165, 0.1)" }}
          >
            <p
              className="text-sm font-schibsted-grotesk"
              style={{ color: "#B91C1C" }}
            >
              {error || "Failed to load creator data"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const latestCoin = coinsData?.profile?.createdCoins?.edges?.[0]?.node;
  const marketCap = latestCoin?.marketCap || "245000000";
  const volume = parseFloat(latestCoin?.totalVolume || "1683").toFixed(0);
  const holders = latestCoin?.uniqueHolders?.toString() || "4";

  return (
    <div className="rounded-2xl p-[6px] mx-3 mb-2 relative select-none">
      <div
        className="absolute inset-0 rounded-2xl z-0"
        style={{
          background:
            "linear-gradient(22deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
        }}
      />
      <div
        className="relative z-10 rounded-2xl overflow-hidden p-3"
        style={{ backgroundColor: "#F2F3F3" }}
      >
        <div className="min-h-[120px]">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-16 h-16 rounded-full p-[4px] relative flex-shrink-0">
              <div
                className="absolute inset-0 rounded-full z-0"
                style={{
                  background:
                    "linear-gradient(0deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
                }}
              />
              <div className="relative z-10 rounded-full overflow-hidden w-full h-full bg-white p-[2px]">
                <div className="rounded-full overflow-hidden w-full h-full bg-black">
                  <img
                    src={
                      creatorProfile?.avatar?.medium ||
                      creatorProfile?.avatar?.small ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                    }
                    alt={creatorProfile?.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-schibsted-grotesk font-semibold text-black">
                {creatorProfile?.displayName || "Creator"}
              </h3>
              <p className="font-schibsted-grotesk text-black opacity-80 text-xs mb-1 truncate">
                @{creatorProfile?.handle || "creator"}
              </p>
            </div>
          </div>

          <div className="w-full mb-3">
            <div className="grid grid-cols-3 gap-2 mb-2 w-full">
              <div className="relative p-[1px] rounded-lg">
                <div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{
                    background:
                      "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
                  }}
                />
                <div className="relative z-10 bg-white rounded-lg p-2 h-full">
                  <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1">
                    Market Cap
                  </span>
                  <div className="flex items-center space-x-0.5">
                    {marketCap.includes("-") ? (
                      <img src={arrowDown.src} alt="arrow-down" />
                    ) : (
                      <img src={arrowUp.src} alt="arrow-up" />
                    )}
                    <span
                      className="font-nunito text-sm font-bold"
                      style={{
                        color: marketCap.includes("-") ? "#E71CEC" : "#06BE16",
                      }}
                    >
                      {formatMarketCap(marketCap)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative p-[1px] rounded-lg">
                <div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{
                    background:
                      "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
                  }}
                />
                <div className="relative z-10 bg-white rounded-lg p-2 h-full">
                  <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1">
                    Volume
                  </span>
                  <div className="flex items-center space-x-0.5">
                    <span className="font-nunito text-sm font-bold text-black">
                      ${parseFloat(volume).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative p-[1px] rounded-lg">
                <div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{
                    background:
                      "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
                  }}
                />
                <div className="relative z-10 bg-white rounded-lg p-2 h-full">
                  <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1">
                    Holders
                  </span>
                  <div className="flex items-center space-x-0.5">
                    <span className="font-nunito text-sm font-bold text-black">
                      {holders}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="font-schibsted-grotesk text-black px-5 py-2 text-md font-medium rounded-xl w-full text-center"
            style={{
              background: isWinner
                ? "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)"
                : "linear-gradient(to right, #EB9CEC 0%, #ED92EF 100%)",
            }}
          >
            Final Score : {finalScore}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EndedCreatorCards() {
  const { contest } = useContest();
  const WINNER_SCORE = 91;
  const LOSER_SCORE = 80;

  if (!contest?.participants?.length) {
    return (
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        <div className="text-center text-gray-500">
          No contest participants found
        </div>
      </div>
    );
  }

  // Get real participant data from contest
  const participant1 = contest.participants[0];
  const participant2 = contest.participants[1];

  const participant1Profile = {
    displayName: participant1?.zoraProfileData?.displayName || participant1?.handle || "Creator 1",
    handle: participant1?.zoraProfileData?.handle || participant1?.handle || "creator1",
    avatar: participant1?.zoraProfileData?.avatar,
  };

  const participant2Profile = participant2 ? {
    displayName: participant2.zoraProfileData?.displayName || participant2.handle || "Creator 2",
    handle: participant2.zoraProfileData?.handle || participant2.handle || "creator2",
    avatar: participant2.zoraProfileData?.avatar,
  } : null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
      {/* First Creator Card */}
      <div className="flex-1 max-w-lg">
        <EndedCreatorCard
          creatorAddress={participant1?.walletAddress || ""}
          isWinner={true}
          finalScore={WINNER_SCORE}
          creatorProfile={participant1Profile}
        />
      </div>

      {/* VS Zorb */}
      <div className="flex-shrink-0 flex items-center justify-center">
        <Image
          src={VsZorb}
          alt="VS"
          width={75}
          height={75}
          className="animate-pulse"
        />
      </div>

      {/* Second Creator Card */}
      {participant2 && participant2Profile && (
        <div className="flex-1 max-w-lg">
          <EndedCreatorCard
            creatorAddress={participant2.walletAddress}
            isWinner={false}
            finalScore={LOSER_SCORE}
            creatorProfile={participant2Profile}
          />
        </div>
      )}
    </div>
  );
}
