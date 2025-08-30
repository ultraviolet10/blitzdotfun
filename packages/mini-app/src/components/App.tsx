"use client";

import { useState } from "react";
import { useMiniApp } from "@neynar/react";
import { usePrivy } from "@privy-io/react-auth";
import { PreContestScreen } from "~/screens/PreContestScreen";
import { OngoingContestScreen } from "~/screens/OngoingContestScreen";
import { ContestEndedScreen } from "~/screens/ContestEndedScreen";
import { AuthScreen } from "~/screens/AuthScreen";

// --- Types ---

export interface AppProps {
  title?: string;
}

type ScreenType = "pre-contest" | "ongoing-contest" | "contest-ended";

/**
 * Flip App - Creator Battle Mini App
 *
 * This is the main container for the Flip mini app, featuring:
 * - Pre-contest screen showing upcoming creator battles
 * - Clean, minimal UI with purple/pink gradient theme
 * - Integration with Zora creator profiles
 * - Real-time countdown timer to contest start
 *
 * @param props - Component props
 * @param props.title - Optional title for the mini app (defaults to "Flip")
 */
export default function App(
  { title: _title }: AppProps = { title: "Blitz" }
) {
  // --- Hooks ---
  const { isSDKLoaded, context } = useMiniApp();
  const { ready, authenticated } = usePrivy();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("pre-contest");

  // --- Early Returns ---
  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading Blitz...</p>
        </div>
      </div>
    );
  }

  // Show authentication screen if not authenticated
  if (!authenticated || !ready) {
    return (
      <div
        style={{
          paddingTop: context?.client.safeAreaInsets?.top ?? 0,
          paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
          paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
          paddingRight: context?.client.safeAreaInsets?.right ?? 0,
        }}
      >
        <AuthScreen />
      </div>
    );
  }

  // --- Screen Navigation ---
  const navigateToScreen = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  // --- Render Current Screen ---
  const renderScreen = () => {
    switch (currentScreen) {
      case "pre-contest":
        return <PreContestScreen onNavigateToOngoing={() => navigateToScreen("ongoing-contest")} />;
      case "ongoing-contest":
        return <OngoingContestScreen 
          onNavigateToPreContest={() => navigateToScreen("pre-contest")}
          onNavigateToEnded={() => navigateToScreen("contest-ended")}
        />;
      case "contest-ended":
        return <ContestEndedScreen onNavigateToPreContest={() => navigateToScreen("pre-contest")} />;
      default:
        return <PreContestScreen onNavigateToOngoing={() => navigateToScreen("ongoing-contest")} />;
    }
  };

  // --- Render ---
  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      {renderScreen()}
    </div>
  );
}
