"use client";

import { useAtomValue } from "jotai";
import Image from "next/image";
import { useState } from "react";
import arrowRightUp2 from "@/assets/arrow_up_right_2.svg";
import copyIcon from "@/assets/copy.svg";
import { compoundUserAtom } from "@/atoms/userAtoms";
import { AuthGuard } from "@/components/AuthGuard";
import { RoutingWrapper } from "@/components/RoutingWrapper";
import { Header } from "@/components/Header";
import { useContest } from "@/hooks/useContest";

export default function WelcomePage() {
  return (
    <AuthGuard>
      <RoutingWrapper>
        <Welcome />
      </RoutingWrapper>
    </AuthGuard>
  );
}

function Welcome() {
  const { contest, participantRole, loading } = useContest();
  const blitzUser = useAtomValue(compoundUserAtom);
  const { profile } = blitzUser;
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [copyTooltip, setCopyTooltip] = useState("Click to copy");

  // Get opponent information
  const getOpponent = () => {
    if (!contest || !participantRole) return null;
    const opponentIndex = participantRole === "participant_one" ? 1 : 0;
    return contest.participants[opponentIndex] || null;
  };

  // Get current participant information
  const getCurrentParticipant = () => {
    if (!contest || !participantRole) return null;
    const currentIndex = participantRole === "participant_one" ? 0 : 1;
    return contest.participants[currentIndex] || null;
  };

  const opponent = getOpponent();
  const currentParticipant = getCurrentParticipant();

  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText("0x");
      setShowCheckmark(true);
      setCopyTooltip("Copied!");
      setTimeout(() => {
        setShowCheckmark(false);
        setCopyTooltip("Click to copy");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyTooltip("Failed to copy");
      setTimeout(() => {
        setCopyTooltip("Click to copy");
      }, 2000);
    }
  };

  const handleDepositClick = () => {
    // Open current participant's Zora profile page for deposits
    if (currentParticipant?.zoraProfile) {
      window.open(
        `https://zora.co/${currentParticipant.zoraProfile}`,
        "_blank"
      );
    } else if (profile.data?.username) {
      window.open(`https://zora.co/${profile.data.username}`, "_blank");
    } else {
      window.open("https://zora.co/", "_blank");
    }
  };

  // Show loading state while checking contest participation
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
          <span className="text-[#67CE67]">Loading contest data...</span>
        </div>
      </div>
    );
  }

  // Routing is now handled by RoutingWrapper, no manual redirects needed

  return (
    <div className="min-h-screen size-full flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl text-center space-y-6">
          <div className="space-y-2">
            <h2
              className="font-dela-gothic-one text-4xl font-bold"
              style={{
                color: "#F1F1F1",
                WebkitTextStroke: "1px #1C7807",
                letterSpacing: "0.1em",
              }}
            >
              WELCOME TO BLITZ!
            </h2>
            <p
              className="font-schibsted-grotesk font-medium text-lg"
              style={{
                color: "#124D04",
              }}
            >
              Your contest with{" "}
              {opponent ? (
                <a
                  href={`https://zora.co/${
                    opponent.zoraProfile || opponent.handle
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80 transition-opacity"
                  style={{ color: "#124D04" }}
                >
                  {opponent.handle || opponent.zoraProfile}
                </a>
              ) : (
                "Aritra"
              )}{" "}
              begins soon!
            </p>
          </div>

          <div className="rounded-2xl p-[6px] relative select-none">
            <div
              className="absolute inset-0 rounded-2xl z-0"
              style={{
                background:
                  "linear-gradient(22deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
              }}
            />
            <div
              className="relative z-10 rounded-2xl overflow-hidden p-4"
              style={{ backgroundColor: "#F2F3F3" }}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="font-schibsted-grotesk text-black opacity-50 text-sm mb-1">
                    Step 1
                  </h3>
                  <p className="font-schibsted-grotesk text-black font-medium text-sm">
                    Withdraw $500 worth of $
                    {currentParticipant ? (
                      <a
                        href={`https://zora.co/${
                          currentParticipant.zoraProfile ||
                          currentParticipant.handle
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-80 transition-opacity"
                        style={{ color: "#1C7807" }}
                      >
                        {currentParticipant.handle?.toUpperCase() ||
                          currentParticipant.zoraProfile?.toUpperCase()}
                      </a>
                    ) : (
                      "ARITRA"
                    )}{" "}
                    into your Zora wallet.
                  </p>
                </div>
                <div>
                  <h3 className="font-schibsted-grotesk text-black opacity-50 text-sm mb-1">
                    Step 2
                  </h3>
                  <p className="font-schibsted-grotesk text-black font-medium text-sm">
                    Send it to{" "}
                    <span
                      className="cursor-pointer inline-flex items-center relative group"
                      onClick={handleCopyContract}
                      title={copyTooltip}
                    >
                      <span
                        className="font-schibsted-grotesk font-bold underline hover:opacity-80 transition-opacity"
                        style={{
                          color: "#1C7807",
                        }}
                      >
                        Blitz.sol
                      </span>
                      {showCheckmark ? (
                        <span className="ml-1 text-green-600 text-xs">✓</span>
                      ) : (
                        <Image
                          src={copyIcon}
                          alt="copy"
                          width={12}
                          height={12}
                          className="ml-1 hover:opacity-70 transition-opacity"
                        />
                      )}
                    </span>{" "}
                    to enter
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            className="font-schibsted-grotesk w-full px-6 py-3 text-base font-semibold rounded-full shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
            style={{
              color: "#124D04",
              background: "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
            }}
            onClick={handleDepositClick}
          >
            <div className="flex justify-center items-center gap-2">
              <span>
                Deposit $
                {currentParticipant ? currentParticipant.handle : "idk"}
              </span>
              <Image src={arrowRightUp2} alt="arrow" width={12} height={12} />
            </div>
          </button>
        </div>
      </div>

      <div className="pb-8 text-center">
        <h3
          className="font-dela-gothic-one text-2xl font-bold opacity-60"
          style={{
            color: "#F1F1F1",
            WebkitTextStroke: "1px #1C7807",
            letterSpacing: "0.1em",
          }}
        >
          THE ARENA FOR CREATOR COINS.
        </h3>
      </div>
    </div>
  );
}
