"use client"

import { usePrivy } from "@privy-io/react-auth"
import Image from "next/image"
import blitzLogo from "@/assets/blitzLogo.svg"
import { AuthGuard } from "@/components/AuthGuard"
import { useContest } from "@/hooks/useContest"
import WelcomeCard from "./WelcomeCard"

export default function WelcomePage() {
    return (
        <AuthGuard>
            <Welcome />
        </AuthGuard>
    )
}

function Welcome() {
    const { logout } = usePrivy()
    const { isParticipant, contest, participantRole, loading } = useContest()

    // Show loading state while checking contest participation
    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
                    <span className="text-[#67CE67]">Loading contest data...</span>
                </div>
            </div>
        )
    }

    // If user is not a participant and there's an active contest, redirect to pre-battle page
    if (contest && !isParticipant) {
        window.location.href = "/pre-battle"
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
                    <span className="text-[#67CE67]">Redirecting to battle...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#121212] size-full">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        <Image src={blitzLogo} alt="Blitz Logo" width={50} height={50} />
                        <h1 className="text-3xl font-bold text-[#67CE67]">Blitz</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {isParticipant && contest && (
                            <div className="px-3 py-1 bg-[#67CE67] text-black text-sm rounded-lg font-medium">
                                Contest Participant
                            </div>
                        )}
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg hover:bg-[#2A2A2A] transition-colors"
                            type="button"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {isParticipant && contest && (
                    <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-6 mb-8">
                        <h2 className="text-xl font-bold text-[#67CE67] mb-4">Your Contest: {contest.name}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-400">Your Role</p>
                                <p className="text-white font-medium capitalize">
                                    {participantRole?.replace("_", " ")}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400">Status</p>
                                <span className="px-2 py-1 bg-[#2A2A2A] text-white text-sm rounded">
                                    {contest.status}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-gray-400 mb-2">Opponent</p>
                            <div className="bg-[#2A2A2A] p-3 rounded">
                                {contest.participants.map((participant, index) => {
                                    const isCurrentUser =
                                        (participantRole === "participant_one" && index === 0) ||
                                        (participantRole === "participant_two" && index === 1)
                                    if (isCurrentUser) return null

                                    return (
                                        <div key={participant.walletAddress}>
                                            <p className="text-white font-medium">{participant.handle}</p>
                                            <p className="text-gray-400 text-sm font-mono">
                                                {participant.walletAddress}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <WelcomeCard />
            </div>
        </div>
    )
}
