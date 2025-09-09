"use client";

import { ZoraProfileData } from "@/lib/zora";
import arrowUp from "@/assets/arrow_up.svg";
import arrowDown from "@/assets/arrow_down.svg";
import Image from "next/image";

export type PostData = {
  image: string;
  zoraUrl: string;
  address: string;
  name: string;
  description: string;
  marketCap: string;
  volume: string;
  holders: string;
};

type CreatorPostCardProps = {
  creator: ZoraProfileData;
  postData: PostData;
};

export function CreatorPostCard({ creator, postData }: CreatorPostCardProps) {
  if (!creator) return null;

  const formatMarketCap = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) {
      return `$ ${(num / 1000000).toFixed(0)} M`;
    } else if (num >= 1000) {
      return `$ ${(num / 1000).toFixed(0)} K`;
    }
    return `$ ${num.toFixed(0)}`;
  };

  const handleBuyOnZora = () => {
    if (creator?.handle) {
      window.open(
        `https://zora.co/coin/base:${postData.address}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const renderPage1 = () => (
    <>
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-16 h-16 rounded-full p-[4px] relative flex-shrink-0">
          <div
            className="absolute inset-0 rounded-full z-0"
            style={{
              background:
                "linear-gradient(0deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
            }}
          />
          <div className="relative z-10 rounded-full overflow-hidden w-full h-full bg-white p-[2px]">
            <div className="rounded-full overflow-hidden w-full h-full bg-black">
              <Image
                src={
                  creator.avatar?.medium ||
                  creator.avatar?.small ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                }
                alt={creator.displayName || "Creator"}
                width={100}
                height={100}
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-schibsted-grotesk font-semibold text-black text-base">
            {creator.displayName || "Creator"}
          </h3>
          <p className="font-schibsted-grotesk text-black opacity-80 text-xs truncate">
            @{creator.handle || "creator"}
          </p>
        </div>
      </div>

      <div className="w-full mb-3">
        <div className="flex items-center space-x-4 w-full">
          <div className="w-20 h-20 bg-black rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={postData.image}
              alt="Post content"
              width={100}
              height={100}
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML =
                  '<div class="text-white text-xs flex items-center justify-center h-full">POST</div>';
              }}
            />
          </div>
          <div className="flex flex-col flex-grow gap-2 justify-center">
            <h4 className="font-schibsted-grotesk font-medium text-black leading-tight text-sm">
              {postData.name}
            </h4>
            <div className="grid grid-cols-3 gap-2 w-full">
              <div className="relative p-[1px] rounded-lg min-w-0">
                <div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{
                    background:
                      "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
                  }}
                />
                <div className="relative z-10 bg-white rounded-lg p-1.5 h-full overflow-hidden">
                  <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1 truncate">
                    Market Cap
                  </span>
                  <div className="flex items-center space-x-0.5 w-full min-w-0">
                    {postData.marketCap.includes("-") ? (
                      <Image
                        src={arrowDown}
                        width={12}
                        height={12}
                        alt="arrow-down"
                        className="flex-shrink-0"
                      />
                    ) : (
                      <Image
                        src={arrowUp}
                        width={12}
                        height={12}
                        alt="arrow-up"
                        className="flex-shrink-0"
                      />
                    )}
                    <span
                      className="font-nunito text-xs font-bold truncate"
                      style={{
                        color: postData.marketCap.includes("-")
                          ? "#E71CEC"
                          : "#06BE16",
                      }}
                    >
                      {formatMarketCap(postData.marketCap)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative p-[1px] rounded-lg min-w-0">
                <div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{
                    background:
                      "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
                  }}
                />
                <div className="relative z-10 bg-white rounded-lg p-1.5 h-full overflow-hidden">
                  <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1 truncate">
                    Volume
                  </span>
                  <div className="flex items-center space-x-0.5 w-full min-w-0">
                    <span className="font-nunito text-xs font-bold text-black truncate">
                      ${parseFloat(postData.volume).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative p-[1px] rounded-lg min-w-0">
                <div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{
                    background:
                      "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
                  }}
                />
                <div className="relative z-10 bg-white rounded-lg p-1.5 h-full overflow-hidden">
                  <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1 truncate">
                    Holders
                  </span>
                  <div className="flex items-center space-x-0.5 w-full min-w-0">
                    <span className="font-nunito text-xs font-bold text-black truncate">
                      {postData.holders}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleBuyOnZora} className="w-full">
        <div
          className="font-schibsted-grotesk px-5 py-2 text-base font-semibold rounded-full w-full text-center"
          style={{
            color: "#124D04",
            background: "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
          }}
        >
          Buy on Zora
        </div>
      </button>
    </>
  );

  return (
    <div className="rounded-2xl p-[6px] w-full max-w-2xl mx-auto mb-2 relative select-none">
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
        <div className="min-h-[100px]">{renderPage1()}</div>
      </div>
    </div>
  );
}
