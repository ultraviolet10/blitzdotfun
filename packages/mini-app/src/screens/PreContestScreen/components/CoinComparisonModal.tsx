"use client";
// TODO: @kshitij-hash: see if we can remove this
import { useEffect, useRef } from "react";
import { CoinComparisonResult } from "~/lib/coinComparison";
import {
  TrendingUp,
  Trophy,
  Users,
  BarChart3,
  Activity,
  X,
} from "lucide-react";

type ExtendedCoinData = {
  uniqueHolders?: number;
  totalVolume?: string;
  volume24h?: string;
  createdAt?: string;
  lastSwapTime?: string;
  swapCount?: number;
};

type CoinComparisonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  comparisonData: CoinComparisonResult | null;
  extendedData: { coin1: ExtendedCoinData; coin2: ExtendedCoinData };
};

export function CoinComparisonModal({
  isOpen,
  onClose,
  comparisonData,
  extendedData,
}: CoinComparisonModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key press
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen || !comparisonData) return null;

  const { coin1, coin2, winner } = comparisonData;

  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    const formatted = value.toFixed(1);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  // Helper function to format market cap
  const formatMarketCap = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "$0.00";

    if (numValue >= 1000000) {
      return `$${(numValue / 1000000).toFixed(2)}M`;
    } else if (numValue >= 1000) {
      return `$${(numValue / 1000).toFixed(1)}K`;
    }
    return `$${numValue.toFixed(2)}`;
  };

  // Helper function to calculate days ago
  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="fixed mb-4 inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } max-h-[80vh] overflow-y-auto`}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
        </div>

        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Coin Performance</h3>
              <p className="text-xs text-gray-400">24h comparison analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-1.5 transition-all focus:outline-none"
            aria-label="Close popover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Popover Content */}
        <div className="px-4 pt-2 pb-4 space-y-3">
          {/* Winner Banner */}
          {winner && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium text-sm">
                  {winner === "coin1" ? coin1.symbol : coin2.symbol} is leading
                  with{" "}
                  {formatPercentage(
                    winner === "coin1"
                      ? coin1.percentageIncrease
                      : coin2.percentageIncrease
                  )}{" "}
                  growth
                </span>
              </div>
            </div>
          )}

          {/* Performance Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">{coin1.symbol}</h4>
                {winner === "coin1" && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    {extendedData.coin1.uniqueHolders || 0} holders
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatPercentage(coin1.percentageIncrease)}
                </div>
                <div className="text-sm text-gray-400">
                  {formatMarketCap(coin1.currentMarketCap)} market cap
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">{coin2.symbol}</h4>
                {winner === "coin2" && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    {extendedData.coin2.uniqueHolders || 0} holders
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatPercentage(coin2.percentageIncrease)}
                </div>
                <div className="text-sm text-gray-400">
                  {formatMarketCap(coin2.currentMarketCap)} market cap
                </div>
              </div>
            </div>
          </div>

          {/* Volume Analysis */}
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-medium">Volume Analysis</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-gray-400 text-sm mb-2">{coin1.symbol}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Total:</span>
                    <span className="text-white font-medium">
                      ${extendedData.coin1.totalVolume || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">24h:</span>
                    <span className="text-white font-medium">
                      ${extendedData.coin1.volume24h || "0.00"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-gray-400 text-sm mb-2">{coin2.symbol}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Total:</span>
                    <span className="text-white font-medium">
                      ${extendedData.coin2.totalVolume || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">24h:</span>
                    <span className="text-white font-medium">
                      ${extendedData.coin2.volume24h || "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity & Age */}
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-medium">Activity & Age</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-gray-400 text-sm mb-2">{coin1.symbol}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Age:</span>
                    <span className="text-white font-medium">
                      {extendedData.coin1.createdAt
                        ? `${getDaysAgo(extendedData.coin1.createdAt)} days`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Swaps:</span>
                    <span className="text-white font-medium">
                      {extendedData.coin1.swapCount || 0}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-gray-400 text-sm mb-2">{coin2.symbol}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Age:</span>
                    <span className="text-white font-medium">
                      {extendedData.coin2.createdAt
                        ? `${getDaysAgo(extendedData.coin2.createdAt)} days`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Swaps:</span>
                    <span className="text-white font-medium">
                      {extendedData.coin2.swapCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Market Cap Change */}
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-medium">Market Cap Change</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-gray-400 text-sm mb-2">{coin1.symbol}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Start:</span>
                    <span className="text-white font-medium">
                      {formatMarketCap(coin1.startMarketCap)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Change:</span>
                    <span
                      className={`font-medium ${
                        coin1.percentageIncrease >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatMarketCap(
                        parseFloat(coin1.currentMarketCap) -
                          parseFloat(coin1.startMarketCap)
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-gray-400 text-sm mb-2">{coin2.symbol}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Start:</span>
                    <span className="text-white font-medium">
                      {formatMarketCap(coin2.startMarketCap)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Change:</span>
                    <span
                      className={`font-medium ${
                        coin2.percentageIncrease >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatMarketCap(
                        parseFloat(coin2.currentMarketCap) -
                          parseFloat(coin2.startMarketCap)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
