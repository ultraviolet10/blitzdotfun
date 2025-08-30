"use client";

import { FlipHeader } from "~/components/shared/FlipHeader";
import { EndedCreatorCards } from "./components/EndedCreatorCards";
import { WinnerAnnouncement } from "./components/WinnerAnnouncement";
import { UserAddressProvider } from "~/contexts/UserAddressContext";

type ContestEndedScreenProps = {
  onNavigateToPreContest?: () => void;
};

export function ContestEndedScreen({
  onNavigateToPreContest,
}: ContestEndedScreenProps) {
  return (
    <UserAddressProvider>
      <div className="min-h-screen bg-white pb-safe flex flex-col">
        <FlipHeader />

        <div className="px-3 py-3 flex-1">
          <EndedCreatorCards />

          {/* //TODO: Shall be removed in production - @kshitij-hash */}
          {onNavigateToPreContest && (
            <div className="flex justify-center mt-2">
              <button
                onClick={onNavigateToPreContest}
                className="bg-lime-400 hover:bg-lime-300 text-black font-semibold py-3 px-6 rounded-full transition-colors"
              >
                Navigate to Welcome
              </button>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <WinnerAnnouncement />
        </div>
      </div>
    </UserAddressProvider>
  );
}
