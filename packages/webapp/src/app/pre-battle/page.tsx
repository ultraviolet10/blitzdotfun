"use client";

import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import Link from "next/link";
import blitzLogo from "@/assets/blitzLogo.svg";
import { AuthGuard } from "@/components/AuthGuard";
import { useContest } from "@/hooks/useContest";

export default function PreBattlePage() {
  return (
    <AuthGuard>
      <PreBattle />
    </AuthGuard>
  );
}

function PreBattle() {
  const { logout } = usePrivy();
  const { contest, loading } = useContest();

  // Show loading state while checking contest data
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
          <span className="text-[#67CE67]">Loading battle info...</span>
        </div>
      </div>
    );
  }

  // If no active contest, show message
  if (!contest) {
    return (
      <div className="min-h-screen bg-[#121212] size-full">
        <div className="container mx-auto px-4 py-8">
          <header className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-4">
              <Image src={blitzLogo} alt="Blitz Logo" width={50} height={50} />
              <h1 className="text-3xl font-bold text-[#67CE67]">Blitz</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg hover:bg-[#2A2A2A] transition-colors"
                type="button"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              No Active Battle
            </h2>
            <p className="text-gray-400 mb-8">
              There are no active battles at the moment. Check back later!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] size-full">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <Image src={blitzLogo} alt="Blitz Logo" width={50} height={50} />
            <h1 className="text-3xl font-bold text-[#67CE67]">Blitz</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/contest"
              className="px-4 py-2 text-sm font-medium bg-[#67CE67] text-black rounded-lg hover:bg-[#5AB85A] transition-colors"
            >
              Watch Battle
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg hover:bg-[#2A2A2A] transition-colors"
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto">
          {/* Battle Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              {contest.name}
            </h2>
            <div className="flex items-center justify-center gap-4">
              <span className="px-3 py-1 bg-[#67CE67] text-black text-sm rounded-lg font-medium">
                {contest.status.replace("_", " ").toUpperCase()}
              </span>
              <span className="text-gray-400">
                Battle starting soon
              </span>
            </div>
          </div>

          {/* Creator Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {contest.participants.map((participant, index) => (
              <div
                key={participant.walletAddress}
                className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-6 text-center"
              >
                {/* Creator Avatar */}
                <div className="mb-6">
                  {participant.zoraProfileData?.avatar?.medium ? (
                    <Image
                      src={participant.zoraProfileData.avatar.medium}
                      alt={participant.handle}
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white ${
                      index === 0 
                        ? 'bg-gradient-to-br from-[#67CE67] to-[#5AB85A]' 
                        : 'bg-gradient-to-br from-[#FF6B6B] to-[#FF5252]'
                    }`}>
                      {participant.handle.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Creator Info */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">
                    {participant.zoraProfileData?.displayName || participant.handle}
                  </h3>
                  
                  {participant.zoraProfileData?.bio && (
                    <p className="text-gray-400 text-sm">
                      {participant.zoraProfileData.bio}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 font-mono">
                    {participant.walletAddress.slice(0, 6)}...{participant.walletAddress.slice(-4)}
                  </div>

                  {/* Social Links */}
                  {participant.zoraProfileData?.socialAccounts && (
                    <div className="flex justify-center gap-3 pt-2">
                      {participant.zoraProfileData.socialAccounts.twitter && (
                        <a
                          href={`https://twitter.com/${participant.zoraProfileData.socialAccounts.twitter.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#67CE67] hover:text-[#5AB85A] text-sm"
                        >
                          Twitter
                        </a>
                      )}
                      {participant.zoraProfileData.socialAccounts.farcaster && (
                        <a
                          href={`https://warpcast.com/${participant.zoraProfileData.socialAccounts.farcaster.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#67CE67] hover:text-[#5AB85A] text-sm"
                        >
                          Farcaster
                        </a>
                      )}
                    </div>
                  )}

                  {/* Creator Coin Info */}
                  {participant.zoraProfileData?.creatorCoin && (
                    <div className="bg-[#2A2A2A] rounded-lg p-3 mt-4">
                      <div className="text-xs text-gray-400 mb-1">Creator Coin</div>
                      <div className="text-sm text-white font-medium">
                        ${participant.zoraProfileData.creatorCoin.marketCap}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* VS Divider */}
          <div className="text-center mb-12">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2A2A2A]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#121212] px-6 text-4xl font-bold text-[#67CE67]">
                  VS
                </span>
              </div>
            </div>
          </div>

          {/* Battle Info */}
          <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Get Ready for the Battle!
            </h3>
            <p className="text-gray-400 mb-6">
              These creators are preparing their content. The battle will begin once both 
              participants have made their deposits and submitted their content.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#67CE67] rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-black font-bold">1</span>
                </div>
                <div className="text-sm text-gray-400">Deposits</div>
                <div className="text-xs text-yellow-400">In Progress</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-gray-400 font-bold">2</span>
                </div>
                <div className="text-sm text-gray-400">Content Creation</div>
                <div className="text-xs text-gray-500">Waiting</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-gray-400 font-bold">3</span>
                </div>
                <div className="text-sm text-gray-400">Battle Begins</div>
                <div className="text-xs text-gray-500">Soon</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Link
                href="/contest"
                className="px-6 py-3 bg-[#67CE67] text-black font-medium rounded-lg hover:bg-[#5AB85A] transition-colors"
              >
                Watch Live
              </Link>
              <button className="px-6 py-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-medium rounded-lg hover:bg-[#2A2A2A] transition-colors">
                Get Notified
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
