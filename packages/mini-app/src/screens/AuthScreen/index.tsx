"use client";

import React from "react";
import { useCrossAppAccounts, usePrivy } from "@privy-io/react-auth";
import zorbSvg from "../../../public/zorb.svg";
import logoSvg from "../../../public/logo.svg";

export function AuthScreen() {
  const { ready, authenticated } = usePrivy();
  const { loginWithCrossAppAccount } = useCrossAppAccounts();

  const handleLogin = () => {
    loginWithCrossAppAccount({ appId: "clpgf04wn04hnkw0fv1m11mnb" });
  };

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
          <img src={logoSvg.src} alt="" className="w-12 h-12" />
        </div>

        <div className="flex-1" />

        <div className="pb-8">
          <div className="space-y-1">
            <div className="text-4xl font-medium text-gray-700 leading-tight">
              Creators battle.
            </div>
            <div className="text-4xl font-bold text-black leading-tight">
              Support by trading.
            </div>
            <div className="text-4xl font-medium text-gray-400 leading-tight">
              Win together.
            </div>
            <div className="text-4xl font-medium text-gray-400 leading-tight">
              Win big.
            </div>
          </div>
        </div>

        <div className="pb-12">
          <button
            onClick={handleLogin}
            type="button"
            disabled={!ready || authenticated}
            className="w-full px-6 py-4 text-black text-lg font-bold rounded-full shadow-lg disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
}
