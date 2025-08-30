"use client";

import { UserAddressProvider } from "~/contexts/UserAddressContext";
import { OngoingCreatorBattle } from "./components/OngoingCreatorBattle";
import { FlipHeader } from "~/components/shared/FlipHeader";
import { ContestTimer } from "~/components/shared/ContestTimer";

type OngoingContestScreenProps = {
  onNavigateToPreContest?: () => void;
  onNavigateToEnded?: () => void;
};

function OngoingContestScreenContent({
  onNavigateToEnded,
}: OngoingContestScreenProps) {
  const contestEndTime = new Date(Date.now() + 1 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-white pb-safe">
      <FlipHeader />

      <div className="px-3 py-2">
        <ContestTimer time={contestEndTime} isStart={false} />
      </div>

      <div className="pb-3">
        <OngoingCreatorBattle />

        {/* //TODO: Shall be removed in production - @kshitij-hash */}
        {onNavigateToEnded && (
          <div className="px-3 py-4">
            <button
              onClick={onNavigateToEnded}
              className="w-full bg-lime-400 text-black font-semibold py-3 px-6 rounded-full border-2 border-black hover:bg-lime-300 transition-colors"
            >
              🧪 Test Navigation → Ended Contest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function OngoingContestScreen(props: OngoingContestScreenProps) {
  return (
    <UserAddressProvider>
      <OngoingContestScreenContent {...props} />
    </UserAddressProvider>
  );
}
