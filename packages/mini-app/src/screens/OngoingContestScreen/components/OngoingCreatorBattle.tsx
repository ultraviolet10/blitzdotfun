"use client";

import { useState, useEffect } from "react";
import { getZoraProfile } from "~/lib/getZoraProfile";
import {
  getCreatorCoinsByAddress,
  ProfileCoinsData,
} from "~/lib/getCreatorCoins";
import { ProfileData } from "~/types/profile";
import { useUserAddress } from "~/contexts/UserAddressContext";
import lightningIcon from "../../../../public/logo.svg";
import { CreatorPostCard } from "./CreatorPostCard";
import { PostData } from "./CreatorPostCard";

const getPostDataFromCoins = (coinsData: ProfileCoinsData | null) => {
  if (!coinsData?.profile?.createdCoins?.edges?.length) {
    return {
      image: "/api/placeholder/400/400",
      zoraUrl: "https://zora.co",
      address: "",
      name: "Latest Collection",
      description: "Check out this amazing new drop!",
    };
  }

  const latestCoin = coinsData.profile.createdCoins.edges[0].node;

  return {
    image:
      latestCoin?.mediaContent?.previewImage?.medium ||
      "/api/placeholder/400/400",
    zoraUrl: `https://zora.co/collect/zora:${latestCoin?.address}`,
    address: latestCoin?.address,
    name: latestCoin?.name || "Latest Collection",
    description: latestCoin?.description || "Check out this amazing new drop!",
    marketCap: latestCoin?.marketCap || "0",
    volume: latestCoin?.totalVolume || "0",
    holders: latestCoin?.uniqueHolders || "0",
  };
};

function CreatorCard({ creatorAddress }: { creatorAddress: string }) {
  const { userAddress } = useUserAddress();
  const [creator, setCreator] = useState<ProfileData | null>(null);
  const [coinsData, setCoinsData] = useState<ProfileCoinsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const postData = getPostDataFromCoins(coinsData);

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
    );
  }

  if (error || !creator?.profile) {
    return (
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: "#124D04" }}>
            Creator Battle
          </h2>
        </div>
        <div
          className="border rounded-2xl p-4 text-center"
          style={{
            background: "rgba(255, 200, 200, 0.1)",
            borderColor: "#ffcccc",
          }}
        >
          <p className="text-red-600 text-sm">
            {error || "Failed to load creator data"}
          </p>
        </div>
      </div>
    );
  }

  return <CreatorPostCard creator={creator} postData={postData as PostData} />;
}

export function OngoingCreatorBattle() {
  const { userAddress } = useUserAddress();

  const SECOND_CREATOR_ADDRESS = "0x58f19e55058057b04feae2eea88f90b84b7714eb";

  return (
    <div className="py-4">
      <CreatorCard creatorAddress={userAddress || ""} />

      <div className="flex items-center justify-center pb-2">
        <div className="w-14 h-14 rounded-full flex items-center justify-center">
          <img src={lightningIcon.src} alt="lightning" />
        </div>
      </div>

      <CreatorCard creatorAddress={SECOND_CREATOR_ADDRESS} />
    </div>
  );
}
