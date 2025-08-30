"use client";

import { useEffect } from "react";
import CloseIcon from "../../../public/close.svg";
import LinkIcon from "../../../public/link.svg";
import XIcon from "../../../public/x.svg";
import TelegramIcon from "../../../public/telegram.svg";
import FarcasterIcon from "../../../public/farcaster.svg";

type ShareDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ShareDrawer({ isOpen, onClose }: ShareDrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="font-schibsted-grotesk fixed inset-0 z-50">
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      />

      <div
        className={`absolute bottom-0 left-0 right-0 rounded-t-3xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        } max-h-[90%] flex flex-col`}
        style={{
          backgroundColor: "#161616",
        }}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              Share Battle Card ⚡
            </h2>
            <p className="text-sm mb-1">Flip Battle Live!</p>
          </div>
          <button onClick={onClose} className="p-1">
            <img src={CloseIcon.src} alt="Close" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* //TODO: @kshitij-hash Replace with actual battle card */}
          <div className="mx-auto max-w-xs mb-8">
            <div className="rounded-[32px] overflow-hidden border border-gray-700 bg-black">
              <div className="bg-black p-5 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-xl font-bold">Aritra</h3>
                    <p className="text-gray-400 text-sm">@ultraviolet1000</p>
                  </div>
                  <div>
                    <img
                      src="/dj-image.png"
                      alt="DJ"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center items-center relative">
                <div className="absolute w-16 h-16 bg-[#7BF25D] rounded-full flex items-center justify-center z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M13 2L4.5 12.5H11L10 22L18.5 11.5H12L13 2Z"
                      fill="black"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="h-1 w-full bg-[#7BF25D]"></div>
              </div>

              <div className="bg-[#FF92C4] p-5 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-black text-xl font-bold">
                      Empress Trash
                    </h3>
                    <p className="text-gray-800 text-sm">@empresstrash</p>
                  </div>
                  <div>
                    <img
                      src="/green-character.png"
                      alt="Green Character"
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-black py-6 px-4 flex flex-col items-center justify-center">
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M13 2L4.5 12.5H11L10 22L18.5 11.5H12L13 2Z"
                      fill="#7BF25D"
                      stroke="#7BF25D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#7BF25D] font-bold text-4xl tracking-wider">
                    BLITZ
                  </span>
                  <svg className="w-8 h-8 ml-3" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M13 2L4.5 12.5H11L10 22L18.5 11.5H12L13 2Z"
                      fill="#7BF25D"
                      stroke="#7BF25D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between w-full mt-2">
                  <span className="text-gray-400 text-lg">@sej_here</span>
                  <span className="text-[#7BF25D] text-lg font-mono">
                    #0001
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* //TODO: @kshitij-hash make them functional, ref to waitlist branch implementation */}
          <div className="flex justify-around mt-8">
            <div className="flex flex-col items-center">
              <button className="w-12 h-12 rounded-full border flex items-center justify-center mb-2">
                <img src={LinkIcon.src} alt="Copy link" />
              </button>
              <span className="text-gray-400 text-xs">Copy link</span>
            </div>
            <div className="flex flex-col items-center">
              <button className="w-12 h-12 rounded-full border flex items-center justify-center mb-2">
                <img src={XIcon.src} alt="X post" />
              </button>
              <span className="text-gray-400 text-xs">X post</span>
            </div>
            <div className="flex flex-col items-center">
              <button className="w-12 h-12 rounded-full border flex items-center justify-center mb-2">
                <img src={TelegramIcon.src} alt="Telegram" />
              </button>
              <span className="text-gray-400 text-xs">Telegram</span>
            </div>
            <div className="flex flex-col items-center">
              <button className="w-12 h-12 rounded-full border flex items-center justify-center mb-2">
                <img src={FarcasterIcon.src} alt="Farcaster" />
              </button>
              <span className="text-gray-400 text-xs">Farcaster</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
