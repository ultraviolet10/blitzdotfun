"use client";

import React, { useState } from "react";
import zorbSvg2 from "../../../public/zorb2.svg";
import logoSvg from "../../../public/logo.svg";
import creatorBgVectorSvg from "../../../public/creator_bg_vector.svg";
import infoIcon from "../../../public/info.svg";
import { InfoDrawer } from "~/components/shared/InfoDrawer";
import arrowRightUp2 from "../../../public/arrow_up_right_2.svg";
import copyIcon from "../../../public/copy.svg";

export function WelcomeScreen({
  onNavigateToSuccess,
}: {
  onNavigateToSuccess: () => void;
}) {
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);

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

        <div className="mt-28">
          <div className="max-w-[250px] flex flex-col gap-4">
            <h2
              className="font-dela-gothic-one text-3xl font-bold"
              style={{
                color: "#F1F1F1",
                WebkitTextStroke: "1px #1C7807",
                letterSpacing: "0.1em",
              }}
            >
              WELCOME TO BLITZ!
            </h2>
            <p className="font-schibsted-grotesk font-medium text-lg" style={{
              color: "#124D04"
            }}>
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
                    <p className="font-schibsted-grotesk text-black font-medium">
                      <span>Send it to</span>{" "}
                      <span className="cursor-pointer inline-flex items-center">
                        <span
                          className="font-schibsted-grotesk font-bold underline"
                          style={{
                            color: "#1C7807",
                          }}
                        >
                          Blitz.sol
                        </span>
                        <img
                          src={copyIcon.src}
                          alt="copy"
                          className="ml-1 w-5 h-5"
                        />
                      </span>{" "}
                      <span>to enter</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            className="font-schibsted-grotesk w-full px-6 py-4 text-lg font-medium rounded-full shadow-lg"
            style={{
              color: "#124D04",
              background: "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
            }}
          >
            <div className="flex justify-center items-center gap-2">
              <span>Deposit $Aritra</span>
              <img src={arrowRightUp2.src} alt="arrow" className="w-3 h-3" />
            </div>
          </button>
        </div>

        {/* //TODO: Shall be removed in production - @kshitij-hash */}
        {onNavigateToSuccess && (
          <div className="flex justify-center mt-2">
            <button
              onClick={onNavigateToSuccess}
              className="bg-lime-400 hover:bg-lime-300 text-black font-semibold py-3 px-6 rounded-full transition-colors"
            >
              Navigate to Success
            </button>
          </div>
        )}

        <InfoDrawer
          isOpen={isInfoDrawerOpen}
          onClose={() => setIsInfoDrawerOpen(false)}
        />
      </div>
    </div>
  );
}
