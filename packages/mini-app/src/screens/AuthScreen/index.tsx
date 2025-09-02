"use client";

import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useMiniApp } from "@neynar/react";
import zorbSvg from "../../../public/zorb.svg";
import logoSvg from "../../../public/logo.svg";

interface AuthScreenProps {
  onContinueWithFarcaster?: () => void;
}

export function AuthScreen({ onContinueWithFarcaster }: AuthScreenProps) {
  const { ready, authenticated, login } = usePrivy();
  // const { loginWithCrossAppAccount } = useCrossAppAccounts();
  const { context } = useMiniApp();

  const handleLogin = () => {
    login();
  };

  const handleContinueWithFarcaster = () => {
    if (onContinueWithFarcaster) {
      onContinueWithFarcaster();
    }
  };

  const hasFarcasterContext = context?.user;

  return (
    <div className="h-screen bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <img
          src={zorbSvg.src}
          alt=""
          className="absolute top-0 left-0 w-full"
        />
      </div>
      <div className="relative z-10 h-full flex flex-col px-4">
        <div className="flex justify-end items-center pt-2">
          <img src={logoSvg.src} alt="" className="w-10 h-10" />
        </div>

        <div className="flex-1" />

        <div className="font-dela-gothic-one pb-8">
          <div className="space-y-1">
            <div
              className="text-2xl font-bold leading-tight"
              style={{
                color: "#F1F4F1",
                WebkitTextStroke: "1px #67CE67",
                letterSpacing: "0.05em",
              }}
            >
              CREATORS BATTLE.
            </div>
            <div
              className="text-2xl font-bold leading-tight"
              style={{
                color: "#F1F4F1",
                WebkitTextStroke: "1px #67CE67",
                letterSpacing: "0.05em",
              }}
            >
              SUPPORT BY TRADING.
            </div>
            <div
              className="text-2xl font-bold leading-tight"
              style={{
                color: "#67CE67",
                letterSpacing: "0.05em",
              }}
            >
              WIN TOGETHER.
            </div>
            <div
              className="text-2xl font-bold leading-tight"
              style={{
                color: "#67CE67",
                letterSpacing: "0.05em",
              }}
            >
              WIN BIG.
            </div>
          </div>
        </div>

        <div className="font-schibsted-grotesk pb-8 space-y-2">
          <button
            onClick={handleLogin}
            disabled={!ready || authenticated}
            className="w-full px-6 py-4 text-black text-lg font-bold rounded-full disabled:opacity-50"
            style={{
              background: "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
            }}
          >
            {!ready ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : (
              "Connect with Zora"
            )}
          </button>

          {/* Farcaster */}
          {hasFarcasterContext && (
            <div className="text-center">
              <button
                onClick={handleContinueWithFarcaster}
                className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
              >
                Continue with Farcaster
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
