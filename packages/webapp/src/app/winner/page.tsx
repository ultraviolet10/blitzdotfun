"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { useContestPolling } from "@/hooks/useContestPolling";
import { Header } from "@/components/Header";
import { WinnerAnnouncement } from "@/components/WinnerAnnouncement";
import { EndedCreatorCards } from "@/components/EndedCreatorCards";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WinnerPage() {
  return (
    <AuthGuard>
      <PostBattle />
    </AuthGuard>
  );
}

function PostBattle() {
  const router = useRouter();
  const { contest, isPolling } = useContestPolling({
    enabled: true,
    interval: 5000,
    onStatusChange: (oldStatus, newStatus) => {
      console.log(`Contest status changed: ${oldStatus} → ${newStatus}`)
      
      // Handle routing based on contest status
      if (newStatus === 'CREATED' || newStatus === 'AWAITING_DEPOSITS' || newStatus === 'AWAITING_CONTENT') {
        router.replace('/pre-battle')
      } else if (newStatus === 'ACTIVE_BATTLE') {
        router.replace('/contest')
      }
      // For COMPLETED/FORFEITED - stay on /winner
    }
  });
  
  const loading = !contest && isPolling;
  
  // Handle routing based on contest status using useEffect to avoid setState-in-render
  useEffect(() => {
    if (contest?.status === 'CREATED' || contest?.status === 'AWAITING_DEPOSITS' || contest?.status === 'AWAITING_CONTENT') {
      router.replace('/pre-battle')
    } else if (contest?.status === 'ACTIVE_BATTLE') {
      router.replace('/contest')
    }
  }, [contest?.status, router])

  if (loading) {
    return (
      <div className="min-h-screen size-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
            <span className="text-[#67CE67]">Loading results...</span>
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
                NO BATTLE RESULTS
              </h2>
              <p
                className="font-schibsted-grotesk font-medium text-lg"
                style={{
                  color: "#124D04",
                }}
              >
                No completed battles found. Check back after a battle ends!
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
          {/* Winner Announcement */}
          <div className="space-y-4">
            <WinnerAnnouncement />
          </div>

          {/* Battle Results Cards */}
          <div className="flex flex-col items-center justify-center gap-4">
            <EndedCreatorCards />
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
