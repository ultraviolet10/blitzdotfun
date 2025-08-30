"use client";

import { useState, useEffect } from "react";
import { CreatorCard } from "./CreatorCard";
import { getZoraProfile } from "~/lib/getZoraProfile";
import { ProfileData } from "~/types/profile";
import { useUserAddress } from "~/contexts/UserAddressContext";
import lightningIcon from "../../../../public/logo.svg";

const KISMET_ADDRESS = "0x58f19e55058057b04feae2eea88f90b84b7714eb";

export function CreatorBattle() {
  const {
    userAddress,
    loading: _addressLoading,
    error: addressError,
  } = useUserAddress();
  const [creators, setCreators] = useState<
    [ProfileData | null, ProfileData | null]
  >([null, null]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCreators() {
      if (!userAddress) {
        setError(addressError || "Please authenticate to view creator battle");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [userProfile, kismetProfile] = await Promise.all([
          getZoraProfile(userAddress),
          getZoraProfile(KISMET_ADDRESS),
        ]);

        setCreators([userProfile, kismetProfile]);
      } catch (err) {
        console.error("Error loading creators:", err);
        setError("Failed to load creator data");
      } finally {
        setLoading(false);
      }
    }

    loadCreators();
  }, [userAddress, addressError]);

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
          <div className="flex items-center justify-center py-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center">
              <img src={lightningIcon.src} alt="lightning" />
            </div>
          </div>
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

  if (error || (!creators[0] && !creators[1])) {
    return (
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: "#124D04" }}>
            Creator Battle
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

  return (
    <div className="py-4">
      {creators[0] && <CreatorCard creator={creators[0]} />}

      <div className="flex items-center justify-center pb-2">
        <div className="w-14 h-14 rounded-full flex items-center justify-center">
          <img src={lightningIcon.src} alt="lightning" />
        </div>
      </div>

      {creators[1] && <CreatorCard creator={creators[1]} />}
    </div>
  );
}
