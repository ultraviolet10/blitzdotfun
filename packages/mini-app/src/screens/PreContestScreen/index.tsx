"use client";

import { CreatorBattle } from "./components/CreatorBattle";
import { UserAddressProvider } from "~/contexts/UserAddressContext";
import { FlipHeader } from "~/components/shared/FlipHeader";
import { ContestTimer } from "~/components/shared/ContestTimer";

type PreContestScreenProps = {
  onNavigateToOngoing?: () => void;
  onNavigateToProfile?: () => void;
};

function PreContestScreenContent({
  onNavigateToOngoing,
  onNavigateToProfile,
}: PreContestScreenProps) {
  const contestStartTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-white pb-safe">
      <FlipHeader onProfileClick={onNavigateToProfile} />

      <div className="px-3 py-2">
        <ContestTimer time={contestStartTime} isStart />
      </div>

      <div className="pb-3">
        <CreatorBattle />

        {/* //TODO: Shall be removed in production - @kshitij-hash */}
        {onNavigateToOngoing && (
          <div className="px-3 py-4">
            <button
              onClick={onNavigateToOngoing}
              className="w-full bg-lime-400 text-black font-semibold py-3 px-6 rounded-full border-2 border-black hover:bg-lime-300 transition-colors"
            >
              🧪 Test Navigation → Ongoing Contest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PreContestScreen({
  onNavigateToOngoing,
  onNavigateToProfile,
}: PreContestScreenProps) {
  return (
    <UserAddressProvider>
      <PreContestScreenContent 
        onNavigateToOngoing={onNavigateToOngoing}
        onNavigateToProfile={onNavigateToProfile}
      />
    </UserAddressProvider>
  );
}
