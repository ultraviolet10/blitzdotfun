"use client";

import { ProfileData } from "~/types/profile";
import arrowUp from "../../../../public/arrow_up.svg";
import arrowDown from "../../../../public/arrow_down.svg";

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
  creator: ProfileData;
  postData: PostData;
};

export function CreatorPostCard({ creator, postData }: CreatorPostCardProps) {
  if (!creator?.profile) return null;

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
    if (creator?.profile?.handle) {
      window.open(
        `https://zora.co/coin/base:${postData.address}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const renderPage1 = () => (
    <>
      <div className="flex items-center space-x-2 mb-3">
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
              <img
                src={
                  creator.profile?.avatar?.medium ||
                  creator.profile?.avatar?.small ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                }
                alt={creator.profile?.displayName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-schibsted-grotesk font-semibold text-black">
            {creator.profile?.displayName || "Creator"}
          </h3>
          <p className="font-schibsted-grotesk text-black opacity-80 text-xs mb-1 truncate">
            @{creator.profile?.handle || "creator"}
          </p>
        </div>
      </div>

      <div className="w-full mb-3">
        <div className="flex items-center space-x-3 w-full">
          <div className="w-20 h-20 bg-black rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={postData.image}
              alt="Post content"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML =
                  '<div class="text-white text-xs flex items-center justify-center h-full">POST</div>';
              }}
            />
          </div>
          <div className="flex flex-col flex-grow gap-2 justify-center">
            <h4 className="font-schibsted-grotesk font-medium text-black leading-tight">
              {postData.name}
            </h4>
            <div className="grid grid-cols-3 gap-2 mb-2 w-full">
              <div className="relative p-[1px] rounded-lg">
                <div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{
                    background:
                      "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
                  }}
                />
                <div className="relative z-10 bg-white rounded-lg p-2 h-full">
                  <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1">
                    Market Cap
                  </span>
                  <div className="flex items-center space-x-0.5">
                    {postData.marketCap.includes("-") ? (
                      <img src={arrowDown.src} alt="arrow-down" />
                    ) : (
                      <img src={arrowUp.src} alt="arrow-up" />
                    )}
                    <span
                      className="font-nunito text-sm font-bold"
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

              <div className="relative p-[1px] rounded-lg">
                <div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{
                    background:
                      "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
                  }}
                />
                <div className="relative z-10 bg-white rounded-lg p-2 h-full">
                  <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1">
                    Volume
                  </span>
                  <div className="flex items-center space-x-0.5">
                    <span className="font-nunito text-sm font-bold text-black">
                      ${parseFloat(postData.volume).toFixed(0)}
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
                <div className="relative z-10 bg-white rounded-lg p-2 h-full">
                  <span className="font-schibsted-grotesk text-xs text-gray-500 font-medium block mb-1">
                    Holders
                  </span>
                  <div className="flex items-center space-x-0.5">
                    <span className="font-nunito text-sm font-bold text-black">
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
          className="font-schibsted-grotesk px-5 py-2 text-md font-semibold rounded-full w-full text-center"
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
    <div className="rounded-2xl p-[6px] mx-3 mb-2 relative select-none">
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
        <div className="min-h-[120px]">{renderPage1()}</div>
      </div>
    </div>
  );
}
