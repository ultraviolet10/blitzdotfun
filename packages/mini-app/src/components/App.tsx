"use client";

import { useState, useEffect } from "react";
import { useMiniApp } from "@neynar/react";
import { usePrivy } from "@privy-io/react-auth";
import { useContests } from "~/hooks/useContests";
import { PreContestScreen } from "~/screens/PreContestScreen";
import { OngoingContestScreen } from "~/screens/OngoingContestScreen";
import { ContestEndedScreen } from "~/screens/ContestEndedScreen";
import { AuthScreen } from "~/screens/AuthScreen";
import { WelcomeScreen } from "~/screens/CreatorScreens/Welcome";
import { PostContentScreen } from "~/screens/CreatorScreens/PostContent";
import { SuccessScreen } from "~/screens/CreatorScreens/Success";

// --- Types ---

export interface AppProps {
  title?: string;
}

type ScreenType =
  | "pre-contest"
  | "ongoing-contest"
  | "contest-ended"
  | "welcome"
  | "success"
  | "post-content";

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
export default function App({ title: _title }: AppProps = { title: "Blitz" }) {
  // --- Hooks ---
  const { isSDKLoaded, context } = useMiniApp();
  const { ready, authenticated } = usePrivy();
  const { contests: _contests, loading: contestsLoading, error: _contestsError, isParticipant, userContest: _userContest } = useContests();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("pre-contest");
  const [initialScreenSet, setInitialScreenSet] = useState(false);

  // Set initial screen based on contest participation
  useEffect(() => {
    if (authenticated && ready && !contestsLoading && !initialScreenSet) {
      if (isParticipant) {
        setCurrentScreen("welcome");
      } else {
        setCurrentScreen("pre-contest");
      }
      setInitialScreenSet(true);
    }
  }, [authenticated, ready, contestsLoading, isParticipant, initialScreenSet]);

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

  // Show loading screen while fetching contests
  if (contestsLoading && !initialScreenSet) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Checking contest participation...</p>
        </div>
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
        return (
          <PreContestScreen
            onNavigateToOngoing={() => navigateToScreen("ongoing-contest")}
          />
        );
      case "ongoing-contest":
        return (
          <OngoingContestScreen
            onNavigateToPreContest={() => navigateToScreen("pre-contest")}
            onNavigateToEnded={() => navigateToScreen("contest-ended")}
          />
        );
      case "contest-ended":
        return (
          <ContestEndedScreen
            onNavigateToPreContest={() => navigateToScreen("welcome")}
          />
        );
      case "welcome":
        return <WelcomeScreen onNavigateToSuccess={() => navigateToScreen("success")} />;
      case "success":
        return <SuccessScreen onNavigateToPostContent={() => navigateToScreen("post-content")} />;
      case "post-content":
        return <PostContentScreen onNavigateToPreContest={() => navigateToScreen("pre-contest")} />;
      default:
        return (
          <PreContestScreen
            onNavigateToOngoing={() => navigateToScreen("ongoing-contest")}
          />
        );
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
