"use client";

import { useState, useEffect } from "react";
import { getZoraProfile } from "~/lib/getZoraProfile";
import {
  getCreatorCoinsByAddress,
  ProfileCoinsData,
} from "~/lib/getCreatorCoins";
import { ProfileData } from "~/types/profile";
import { useUserAddress } from "~/contexts/UserAddressContext";
import arrowUp from "../../../../public/arrow_up.svg";
import arrowDown from "../../../../public/arrow_down.svg";

const formatMarketCap = (value: string) => {
  const num = parseFloat(value);
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(0)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${num.toFixed(0)}`;
};

type EndedCreatorCardProps = {
  creatorAddress: string;
  isWinner: boolean;
  finalScore: number;
};

function EndedCreatorCard({
  creatorAddress,
  isWinner,
  finalScore,
}: EndedCreatorCardProps) {
  const { userAddress } = useUserAddress();
  const [creator, setCreator] = useState<ProfileData | null>(null);
  const [coinsData, setCoinsData] = useState<ProfileCoinsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCreatorData() {
      const addressToUse = creatorAddress || userAddress;
      if (!addressToUse) {
        setError("No address available");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [profile, coins] = await Promise.all([
          getZoraProfile(addressToUse),
          getCreatorCoinsByAddress(addressToUse, 10),
        ]);

        setCreator(profile);
        setCoinsData(coins);
      } catch (err) {
        console.error("Error loading creator data:", err);
        setError("Failed to load creator data");
      } finally {
        setLoading(false);
      }
    }

    loadCreatorData();
  }, [creatorAddress, userAddress]);

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

  if (error || !creator?.profile) {
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
                      creator.profile?.avatar?.medium ||
                      creator.profile?.avatar?.small ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                    }
                    alt={creator.profile?.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-schibsted-grotesk font-semibold text-black">
                {creator.profile?.displayName || "Creator"}
              </h3>
              <p className="font-schibsted-grotesk text-black opacity-80 text-xs mb-1 truncate">
                @{creator.profile?.handle || "creator"}
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
  const { userAddress } = useUserAddress();

  const SECOND_CREATOR_ADDRESS = "0x58f19e55058057b04feae2eea88f90b84b7714eb";
  const WINNER_SCORE = 91;
  const LOSER_SCORE = 80;

  return (
    <div className="space-y-6">
      <EndedCreatorCard
        creatorAddress={userAddress || ""}
        isWinner={true}
        finalScore={WINNER_SCORE}
      />

      <EndedCreatorCard
        creatorAddress={SECOND_CREATOR_ADDRESS}
        isWinner={false}
        finalScore={LOSER_SCORE}
      />
    </div>
  );
}
