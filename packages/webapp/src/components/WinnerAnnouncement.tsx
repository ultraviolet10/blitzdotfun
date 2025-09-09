"use client";

import { useContest } from "@/hooks/useContest";

export function WinnerAnnouncement() {
  const { contest, loading: contestLoading } = useContest();

  const loading = contestLoading || !contest;
  
  // For now, assume first participant is winner (in real app, this would come from battle results)
  const winner = contest?.participants?.[0];
  
  if (loading) {
    return (
      <div className="relative w-full h-[215px] animate-pulse overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-lime-300 to-green-500"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/20 rounded-xl w-3/4 h-24"></div>
        </div>
      </div>
    );
  }

  if (!winner || !contest?.participants?.length) {
    return (
      <div className="relative w-full h-[215px] overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-lime-300 to-green-500"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 m-4 shadow-lg">
            <p className="text-red-600 text-sm">
              No contest participants found
            </p>
          </div>
        </div>
      </div>
    );
  }

  const avatar = winner.zoraProfileData?.avatar?.medium || winner.zoraProfileData?.avatar?.small || "/api/placeholder/80/80";
  const name = winner.zoraProfileData?.displayName || winner.zoraProfileData?.handle || "Unknown Creator";
  const handle = winner.zoraProfileData?.handle ? `@${winner.zoraProfileData.handle}` : "@unknown";

  return (
    <div
      className="relative w-full h-[215px] overflow-hidden"
      style={{
        background: "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
        borderTopRightRadius: "12px",
        borderTopLeftRadius: "12px",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[5px] z-10">
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(60deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
          }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <h2
          className="font-dela-gothic-one text-3xl font-bold"
          style={{
            color: "white",
            WebkitTextStroke: "1px #1C7807",
            letterSpacing: "0.1em",
          }}
        >
          WINNER!
        </h2>

        <div className="rounded-2xl p-[8px] mt-2 w-4/5 max-w-[280px] relative">
          <div
            className="absolute inset-0 rounded-2xl z-0"
            style={{
              background:
                "linear-gradient(11deg, #B0B0B0 0%, #C3C3C3 15%, #DCDCDC 30%, #FDFEFE 50%, #DCDCDC 70%, #C3C3C3 85%, #B0B0B0 100%)",
            }}
          />
          <div className="relative z-10 bg-white rounded-2xl p-3 shadow-xl w-full h-full">
            <div className="flex items-center space-x-3 w-full h-full">
              <div className="w-16 h-16 rounded-full p-[5px] relative flex-shrink-0">
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
                      src={avatar}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col flex-1 min-w-0 justify-center h-full">
                <h3 className="font-schibsted-grotesk text-lg font-semibold text-black leading-tight">
                  {name}
                </h3>
                <p className="font-schibsted-grotesk text-black opacity-80 text-sm truncate">
                  {handle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
