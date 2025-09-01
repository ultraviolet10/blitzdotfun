"use client";

import { useState } from "react";
import { useMiniApp } from "@neynar/react";
import xIcon from "../../../public/x.svg";
import zoraIcon from "../../../public/zora.svg";

interface ProfileScreenProps {
  onBack: () => void;
}

type TabType = "socials" | "wallets";

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { context } = useMiniApp();
  const [activeTab, setActiveTab] = useState<TabType>("socials");
  const [isConnectingZora, setIsConnectingZora] = useState(false);
  const handleZoraConnect = async () => {
    setIsConnectingZora(true);
    setTimeout(() => {
      setIsConnectingZora(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white pb-safe">
      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1
          className="font-dela-gothic-one text-xl font-bold"
          style={{
            color: "transparent",
            WebkitTextStroke: "1px #1C7807",
            letterSpacing: "0.1em",
          }}
        >
          PROFILE
        </h1>
        <div className="w-16"></div>
      </div>

      {/* Profile Section */}
      {context?.user && (
        <div className="px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full p-[3px] relative flex-shrink-0">
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
                      context.user.pfpUrl ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="font-schibsted-grotesk font-bold text-xl text-black">
                {context.user.displayName || context.user.username}
              </h2>
              <p className="font-schibsted-grotesk text-gray-600 text-sm">
                @{context.user.username}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-4 mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("socials")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "socials"
                ? "bg-white text-black shadow-sm"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Socials
          </button>
          <button
            onClick={() => setActiveTab("wallets")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "wallets"
                ? "bg-white text-black shadow-sm"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Wallets
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {activeTab === "socials" && (
          <div className="space-y-3">
            {/* Twitter/X Connection */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <img src={xIcon.src} alt="X" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-schibsted-grotesk font-medium text-black">
                      X
                    </p>
                  </div>
                </div>
                <button
                  className="font-schibsted-grotesk px-4 py-2 text-sm font-bold rounded-full"
                  style={{
                    color: "#124D04",
                    background:
                      "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
                  }}
                >
                  Connect
                </button>
              </div>
            </div>

            {/* Zora Connection */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={zoraIcon.src} alt="Zora" className="w-10 h-10" />
                  <div>
                    <p className="font-schibsted-grotesk font-medium text-black">
                      Zora
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleZoraConnect}
                  disabled={isConnectingZora}
                  className="font-schibsted-grotesk px-4 py-2 text-sm font-bold rounded-full disabled:opacity-50"
                  style={{
                    color: "#124D04",
                    background:
                      "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
                  }}
                >
                  {isConnectingZora ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "wallets" && (
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
              <p className="text-gray-500 font-schibsted-grotesk mb-4">
                No wallets connected
              </p>
              <button
                className="font-schibsted-grotesk px-6 py-3 text-sm font-bold rounded-full"
                style={{
                  color: "#124D04",
                  background:
                    "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
                }}
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
