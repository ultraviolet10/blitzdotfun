"use client";

import React, { useState } from "react";
import zorbSvg2 from "../../../public/zorb2.svg";
import logoSvg from "../../../public/logo.svg";
import creatorBgVectorSvg from "../../../public/creator_bg_vector.svg";
import infoIcon from "../../../public/info.svg";
import { InfoDrawer } from "~/components/shared/InfoDrawer";
import arrowRightUp2 from "../../../public/arrow_up_right_2.svg";
import copyIcon from "../../../public/copy.svg";
import { useContests } from "~/hooks/useContests";
import { useMiniApp } from "@neynar/react";

export function WelcomeScreen({
  onNavigateToSuccess,
}: {
  onNavigateToSuccess: () => void;
}) {
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [copyTooltip, setCopyTooltip] = useState("Copy");
  const [showCheckmark, setShowCheckmark] = useState(false);
  const { userContest } = useContests();
  const { actions } = useMiniApp();

  const handleCopyContract = async () => {
    if (userContest?.contractAddress) {
      try {
        await navigator.clipboard.writeText(userContest.contractAddress);
        setCopyTooltip("Copied!");
        setShowCheckmark(true);
        setTimeout(() => {
          setCopyTooltip("Copy");
          setShowCheckmark(false);
        }, 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleDepositClick = () => {
    actions.openUrl({
      url: "https://zora.co/" + userContest,
    });
  };

  return (
    <div className="h-screen bg-white relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={creatorBgVectorSvg.src}
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute bottom-0 w-full h-full z-0">
        <img src={zorbSvg2.src} alt="" className="absolute bottom-0 w-full" />
      </div>
      <div className="relative z-10 h-full flex flex-col px-4">
        <div className="flex justify-between items-center pt-3">
          <div className="flex items-center gap-2">
            <img src={logoSvg.src} alt="" className="w-12 h-12" />
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
          </div>
          <button onClick={() => setIsInfoDrawerOpen(true)}>
            <img src={infoIcon.src} alt="info" className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-20 flex-1 flex flex-col">
          <div className="w-full text-center mb-8">
            <h2
              className="font-dela-gothic-one text-4xl font-bold mb-4"
              style={{
                color: "#F1F1F1",
                WebkitTextStroke: "1px #1C7807",
                letterSpacing: "0.1em",
              }}
            >
              WELCOME TO BLITZ!
            </h2>
            <p
              className="font-schibsted-grotesk font-medium text-xl"
              style={{
                color: "#124D04",
              }}
            >
              Your contest with Aritra begins soon!
            </p>
          </div>

          <div className="rounded-2xl p-[6px] mt-12 mb-6 relative select-none">
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
              <div className="min-h-[120px] p-2">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <h3 className="font-schibsted-grotesk text-black opacity-50">
                      Step 1
                    </h3>
                    <p className="font-schibsted-grotesk text-black font-medium">
                      Withdraw $500 worth of $ARITRA into your Zora wallet.
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-schibsted-grotesk text-black opacity-50">
                      Step 2
                    </h3>
                    <p className="font-schibsted-grotesk text-black font-medium text-base leading-relaxed">
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
                          {userContest?.contractAddress
                            ? `${userContest.contractAddress.slice(
                                0,
                                6
                              )}...${userContest.contractAddress.slice(-4)}`
                            : "Blitz.sol"}
                        </span>
                        {showCheckmark ? (
                          <span className="ml-1 text-green-600 text-sm">✓</span>
                        ) : (
                          <img
                            src={copyIcon.src}
                            alt="copy"
                            className="ml-1 w-4 h-4 hover:opacity-70 transition-opacity"
                          />
                        )}
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          {copyTooltip}
                        </div>
                      </span>{" "}
                      to enter
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            className="font-schibsted-grotesk w-full px-6 py-4 text-lg font-semibold rounded-full shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
            style={{
              color: "#124D04",
              background: "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
            }}
            onClick={handleDepositClick}
          >
            <div className="flex justify-center items-center gap-2">
              <span>Deposit $Aritra</span>
              <img src={arrowRightUp2.src} alt="arrow" className="w-3 h-3" />
            </div>
          </button>
        </div>
        <InfoDrawer
          isOpen={isInfoDrawerOpen}
          onClose={() => setIsInfoDrawerOpen(false)}
        />
      </div>
    </div>
  );
}
