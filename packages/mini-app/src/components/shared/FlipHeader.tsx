"use client";

import { useState } from "react";
import { useCrossAppAccounts, usePrivy } from "@privy-io/react-auth";
import { useMiniApp } from "@neynar/react";
import { InfoDrawer } from "./InfoDrawer";
import { ShareDrawer } from "./ShareDrawer";
import infoIcon from "../../../public/info.svg";
import exportIcon from "../../../public/export.svg";

interface FlipHeaderProps {
  onProfileClick?: () => void;
}

export function FlipHeader({ onProfileClick }: FlipHeaderProps) {
  const { ready, authenticated, user } = usePrivy();
  const { loginWithCrossAppAccount } = useCrossAppAccounts();
  const { context } = useMiniApp();
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);

  return (
    <>
      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <h1
          className="font-dela-gothic-one text-2xl font-bold"
          style={{
            color: "transparent",
            WebkitTextStroke: "1px #1C7807",
            letterSpacing: "0.1em",
          }}
        >
          BLITZ
        </h1>

        <div className="flex items-center space-x-2">
          {ready && authenticated && user && context?.user ? (
            <button
              onClick={onProfileClick}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <img
                src={context.user.pfpUrl || "/default-avatar.png"}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2"
                style={{ borderColor: "#1C7807" }}
              />
            </button>
          ) : (
            <button
              onClick={() =>
                loginWithCrossAppAccount({ appId: "clpgf04wn04hnkw0fv1m11mnb" })
              }
              disabled={!ready}
              className="font-schibsted-grotesk px-5 py-2 text-sm font-bold rounded-full"
              style={{
                color: "#124D04",
                background:
                  "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
              }}
            >
              {!ready ? "Loading..." : "Connect Wallet"}
            </button>
          )}
          <button onClick={() => setIsInfoDrawerOpen(true)}>
            <img src={infoIcon.src} alt="info" className="w-6 h-6" />
          </button>
          <button onClick={() => setIsShareDrawerOpen(true)}>
            <img src={exportIcon.src} alt="export" className="w-6 h-6" />
          </button>
        </div>
      </div>

      <InfoDrawer
        isOpen={isInfoDrawerOpen}
        onClose={() => setIsInfoDrawerOpen(false)}
      />

      <ShareDrawer
        isOpen={isShareDrawerOpen}
        onClose={() => setIsShareDrawerOpen(false)}
      />
    </>
  );
}
