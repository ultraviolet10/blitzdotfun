"use client";

import { useState, useRef } from "react";
import arrowUp from "@/assets/arrow_up.svg";
import arrowUpRight from "@/assets/arrow_up_right.svg";
import type { ZoraProfileData } from "@/lib/zora";
import Image from "next/image";

type CreatorCardProps = {
  creator: ZoraProfileData;
};

const mockTopHolders = [
  { id: 1, avatar: "https://github.com/evilrabbit.png" },
  { id: 2, avatar: "https://github.com/evilrabbit.png" },
  { id: 3, avatar: "https://github.com/evilrabbit.png" },
];

export function CreatorCard({ creator }: CreatorCardProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleCardClick = () => {
    window.open(
      `https://zora.co/${creator.handle}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const endX = e.changedTouches[0].clientX;
    const diffX = startX.current - endX;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentPage < 1) {
        setCurrentPage(1);
      } else if (diffX < 0 && currentPage > 0) {
        setCurrentPage(0);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const endX = e.clientX;
    const diffX = startX.current - endX;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentPage < 1) {
        setCurrentPage(1);
      } else if (diffX < 0 && currentPage > 0) {
        setCurrentPage(0);
      }
    }
  };

  if (!creator) return null;

  const marketCap = creator.creatorCoin?.marketCap || "0";

  const formatMarketCap = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) {
      return `$ ${(num / 1000000).toFixed(0)} M`;
    } else if (num >= 1000) {
      return `$ ${(num / 1000).toFixed(0)} K`;
    }
    return `$ ${num.toFixed(0)}`;
  };

  console.log(creator);

  const renderPage1 = () => (
    <>
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-24 h-24 rounded-full p-[6px] relative flex-shrink-0">
          <div
            className="absolute inset-0 rounded-full z-0"
            style={{
              background:
                "linear-gradient(0deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
            }}
          />
          <div className="relative z-10 rounded-full overflow-hidden w-full h-full bg-white p-[4px]">
            <div className="rounded-full overflow-hidden w-full h-full bg-black">
              <Image
                src={
                  creator.avatar?.medium ||
                  creator.avatar?.small ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                }
                width={100}
                height={100}
                alt={creator.displayName || "Creator"}
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <div className="flex items-center space-x-1 mb-0.5">
              <h3 className="font-schibsted-grotesk font-semibold text-black">
                {creator.displayName || "Creator"}
              </h3>
              <button onClick={handleCardClick}>
                <Image
                  src={arrowUpRight}
                  alt="arrow-up-right"
                  width={14}
                  height={14}
                />
              </button>
            </div>
            <p className="font-schibsted-grotesk text-black opacity-80 text-xs mb-1 truncate">
              @{creator.handle || "creator"}
            </p>
          </div>
          <p className="font-schibsted-grotesk text-black opacity-80 text-xs mb-1 truncate">
            {creator.bio || ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="relative p-[1px] rounded-lg">
          <div
            className="absolute inset-0 rounded-lg z-0"
            style={{
              background:
                "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
            }}
          />
          <div className="relative z-10 bg-white rounded-lg p-2">
            <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1">
              Market Cap
            </span>
            <div className="flex items-center space-x-0.5">
              <Image src={arrowUp} alt="arrow-up" width={14} height={14} />
              <span className="font-nunito text-sm font-bold text-green-500">
                {formatMarketCap(marketCap)}
              </span>
            </div>
          </div>
        </div>

        <div className="relative p-[1px] rounded-lg">
          <div
            className="absolute inset-0 rounded-lg z-0"
            style={{
              background:
                "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
            }}
          />
          <div className="relative z-10 bg-white rounded-lg p-2">
            <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1">
              Top Holders
            </span>
            <div className="flex space-x-1">
              {mockTopHolders.map((holder, index) => (
                <Image
                  key={holder.id}
                  src={holder.avatar}
                  alt="Holder"
                  width={20}
                  height={20}
                  className="rounded-full"
                  style={{ zIndex: mockTopHolders.length - index }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // TODO: content and UI changes required for this @kshitij-hash
  const renderPage2 = () => (
    <>
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden flex-shrink-0">
          <Image
            src={
              creator.avatar?.medium ||
              creator.avatar?.small ||
              "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
            }
            alt={creator.displayName || "Creator"}
            width={20}
            height={20}
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-black text-sm truncate">
            {creator.displayName || "Creator"}
          </h3>
          <p className="text-gray-500 text-xs">Battle Stats</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-xs text-gray-500 font-medium block mb-1">
            Total Trades
          </span>
          <span className="text-sm font-bold text-blue-500">1,247</span>
        </div>

        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-xs text-gray-500 font-medium block mb-1">
            24h Volume
          </span>
          <span className="text-sm font-bold text-purple-500">$12.4K</span>
        </div>

        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-xs text-gray-500 font-medium block mb-1">
            Supporters
          </span>
          <span className="text-sm font-bold text-orange-500">89</span>
        </div>

        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-xs text-gray-500 font-medium block mb-1">
            Win Rate
          </span>
          <span className="text-sm font-bold text-green-500">73%</span>
        </div>
      </div>
    </>
  );

  return (
    <div
      ref={cardRef}
      className="rounded-2xl p-[6px] mx-3 mb-2 relative select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
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
        <div className="min-h-[120px]">
          {currentPage === 0 ? renderPage1() : renderPage2()}
        </div>

        <div className="flex justify-center space-x-1.5 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPage(0);
            }}
            className={`rounded-full transition-all ${
              currentPage === 0 ? "w-3.5 h-1.5" : "w-1.5 h-1.5"
            }`}
            style={{
              backgroundColor:
                currentPage === 0 ? "#838383" : "rgba(0,0,0,0.2)",
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPage(1);
            }}
            className={`rounded-full transition-all ${
              currentPage === 1 ? "w-3.5 h-1.5" : "w-1.5 h-1.5"
            }`}
            style={{
              backgroundColor:
                currentPage === 1 ? "#838383" : "rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
