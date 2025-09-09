"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { useContestPolling } from "@/hooks/useContestPolling";
import { Header } from "@/components/Header";
import { ContestTimer } from "@/components/ContestTimer";
import { CreatorPostCard, PostData } from "@/components/CreatorPostCard";
import { getCreatorCoins, getFirstCoinFromProfile } from "@/lib/getCreatorCoins";
import VsZorb from "@/assets/vs_zorb.svg";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContestPage() {
  return (
    <AuthGuard>
      <Contest />
    </AuthGuard>
  );
}

function Contest() {
  const router = useRouter();
  const { contest, isPolling } = useContestPolling({
    enabled: true,
    interval: 5000,
    onStatusChange: (oldStatus, newStatus) => {
      console.log(`Contest status changed: ${oldStatus} → ${newStatus}`)
      
      // Handle routing based on contest status
      if (newStatus === 'CREATED' || newStatus === 'AWAITING_DEPOSITS' || newStatus === 'AWAITING_CONTENT') {
        router.replace('/pre-battle')
      } else if (newStatus === 'COMPLETED' || newStatus === 'FORFEITED') {
        router.replace('/winner')
      }
      // For ACTIVE_BATTLE - stay on /contest
    }
  });
  const [postData, setPostData] = useState<PostData[]>([]);
  const [loadingCoins, setLoadingCoins] = useState(true);
  
  const loading = !contest && isPolling;
  
  // Handle routing based on contest status using useEffect to avoid setState-in-render
  useEffect(() => {
    if (contest?.status === 'CREATED' || contest?.status === 'AWAITING_DEPOSITS' || contest?.status === 'AWAITING_CONTENT') {
      router.replace('/pre-battle')
    } else if (contest?.status === 'COMPLETED' || contest?.status === 'FORFEITED') {
      router.replace('/winner')
    }
  }, [contest?.status, router])

  // Fetch real coin data for creators
  useEffect(() => {
    const fetchCreatorCoins = async () => {
      if (!contest?.participants) {
        setLoadingCoins(false);
        return;
      }

      try {
        const coinDataPromises = contest.participants.map(async (participant) => {
          if (!participant.walletAddress) return null;
          
          const profileData = await getCreatorCoins({
            identifier: participant.walletAddress,
            count: 1, // Only need the first coin
          });
          
          const firstCoin = getFirstCoinFromProfile(profileData || {});
          
          if (firstCoin) {
            return {
              image: firstCoin.mediaContent?.previewImage?.medium || 
                     firstCoin.mediaContent?.previewImage?.small ||
                     "https://api.dicebear.com/7.x/shapes/svg?seed=" + participant.handle,
              zoraUrl: `https://zora.co/coin/base:${firstCoin.address}`,
              address: firstCoin.address || "",
              name: firstCoin.name || 'what is "onchain"?',
              description: firstCoin.description || "Creator coin battle",
              marketCap: firstCoin.marketCap || "0",
              volume: firstCoin.volume24h || "0",
              holders: firstCoin.uniqueHolders?.toString() || "0",
            } as PostData;
          }
          
          // Fallback to mock data if no coin found
          return {
            image: "https://api.dicebear.com/7.x/shapes/svg?seed=" + participant.handle,
            zoraUrl: `https://zora.co/${participant.handle}`,
            address: participant.walletAddress,
            name: 'what is "onchain"?',
            description: "Creator coin battle",
            marketCap: "245000",
            volume: "1683",
            holders: "4",
          } as PostData;
        });

        const results = await Promise.all(coinDataPromises);
        const validResults = results.filter((data): data is PostData => data !== null);
        setPostData(validResults);
      } catch (error) {
        console.error("Failed to fetch creator coins:", error);
        // Fallback to mock data on error
        setPostData([
          {
            image: "https://api.dicebear.com/7.x/shapes/svg?seed=post1",
            zoraUrl: "https://zora.co/coin/base/0x123",
            address: "0x123456789abcdef",
            name: 'what is "onchain"?',
            description: "Exploring the fundamentals of blockchain technology",
            marketCap: "245000",
            volume: "1683",
            holders: "4",
          },
          {
            image: "https://api.dicebear.com/7.x/shapes/svg?seed=post2",
            zoraUrl: "https://zora.co/coin/base/0x456",
            address: "0x456789abcdef123",
            name: 'what is "onchain"?',
            description: "Deep dive into decentralized systems",
            marketCap: "200000",
            volume: "1683",
            holders: "4",
          },
        ]);
      } finally {
        setLoadingCoins(false);
      }
    };

    fetchCreatorCoins();
  }, [contest]);

  if (loading || loadingCoins) {
    return (
      <div className="min-h-screen size-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
            <span className="text-[#67CE67]">Loading battle...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
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
                NO ACTIVE BATTLE
              </h2>
              <p
                className="font-schibsted-grotesk font-medium text-lg"
                style={{
                  color: "#124D04",
                }}
              >
                There are no active battles at the moment. Check back later!
              </p>
            </div>
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

  return (
    <div className="min-h-screen size-full flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl text-center space-y-8">
          {/* Battle Timer */}
          <div className="space-y-4">
            <ContestTimer 
              time={contest?.battleEndTime ? new Date(contest.battleEndTime) : undefined} 
              isStart={false} 
            />
          </div>

          {/* Battle Cards with VS */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* First Creator Post Card */}
            {contest.participants[0]?.zoraProfileData && postData[0] && (
              <div className="flex-1 max-w-lg">
                <CreatorPostCard
                  creator={contest.participants[0].zoraProfileData}
                  postData={postData[0]}
                />
              </div>
            )}

            {/* VS Zorb */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <Image
                src={VsZorb}
                alt="VS"
                width={75}
                height={75}
                className="animate-pulse"
              />
            </div>

            {/* Second Creator Post Card */}
            {contest.participants[1]?.zoraProfileData && postData[1] && (
              <div className="flex-1 max-w-lg">
                <CreatorPostCard
                  creator={contest.participants[1].zoraProfileData}
                  postData={postData[1]}
                />
              </div>
            )}
          </div>
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
