"use client";
// TODO: @kshitij-hash: see if we can remove this
import { useState, useEffect } from "react";
import { compareCoinMarketCaps, CoinComparisonResult } from "~/lib/coinComparison";
import { BarChart3 } from "lucide-react";
import { CoinComparisonModal } from "./CoinComparisonModal";

type CoinComparisonProps = {
  coinAddress1: string;
  coinAddress2: string;
  startTimestamp: number;
};

// Extended coin data type to include additional information from API response
type ExtendedCoinData = {
  uniqueHolders?: number;
  totalVolume?: string;
  volume24h?: string;
  createdAt?: string;
  lastSwapTime?: string;
  swapCount?: number;
};

export function CoinComparison({ coinAddress1, coinAddress2, startTimestamp }: CoinComparisonProps) {
  const [comparisonData, setComparisonData] = useState<CoinComparisonResult | null>(null);
  const [extendedData, setExtendedData] = useState<{coin1: ExtendedCoinData, coin2: ExtendedCoinData}>({coin1: {}, coin2: {}});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchComparisonData() {
      try {
        setLoading(true);
        setError(null);
        
        const result = await compareCoinMarketCaps({
          coinAddress1,
          coinAddress2,
          startTimestamp
        });
        
        // Simulate fetching extended data that would come from the API
        // In a real implementation, this would be fetched from the API
        const extData = {
          coin1: {
            uniqueHolders: 2,
            totalVolume: "3.11",
            volume24h: "0.0",
            createdAt: "2025-07-21T04:11:29",
            lastSwapTime: "2025-08-12T13:34:49",
            swapCount: 6
          },
          coin2: {
            uniqueHolders: 5,
            totalVolume: "4.25",
            volume24h: "1.2",
            createdAt: "2025-07-15T14:22:15",
            lastSwapTime: "2025-08-14T09:12:33",
            swapCount: 12
          }
        };
        
        setComparisonData(result);
        setExtendedData(extData);
      } catch (err) {
        console.error("Error fetching coin comparison data:", err);
        setError("Failed to load comparison data");
      } finally {
        setLoading(false);
      }
    }

    fetchComparisonData();
  }, [coinAddress1, coinAddress2, startTimestamp]);

  if (loading) {
    return (
      <div className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center animate-pulse">
        <div className="w-5 h-5 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !comparisonData) {
    return null;
  }

  // Data is available but only used in modal

  return (
    <>
      {/* Comparison Icon Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-500/30 rounded-full flex items-center justify-center transition-all"
        aria-label="View coin performance comparison"
      >
        <BarChart3 className="w-5 h-5 text-green-400" />
      </button>

      {/* Modal */}
      <CoinComparisonModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        comparisonData={comparisonData}
        extendedData={extendedData}
      />
    </>
  );
}
