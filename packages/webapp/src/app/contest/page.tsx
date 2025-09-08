"use client"

import { usePrivy } from "@privy-io/react-auth"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import blitzLogo from "@/assets/blitzLogo.svg"
import { AuthGuard } from "@/components/AuthGuard"

interface Contest {
    contestId: string
    name: string
    status: string
    participants: Array<{
        handle: string
        walletAddress: string
        zoraProfile?: string
    }>
    createdAt: string
}

export default function ContestPage() {
    return (
        <AuthGuard>
            <ContestView />
        </AuthGuard>
    )
}

function ContestView() {
    const { logout } = usePrivy()
    const [contest, setContest] = useState<Contest | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchContest = async () => {
            try {
                const response = await fetch("/api/contests/active")
                const data = await response.json()

                if (response.ok) {
                    setContest(data.contest)
                } else {
                    setError(data.error || "Failed to load contest")
                }
            } catch (err) {
                console.error("Error: ", err)
                setError("Failed to load contest data")
            } finally {
                setLoading(false)
            }
        }

        fetchContest()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
                    <span className="text-[#67CE67]">Loading battle...</span>
                </div>
            </div>
        )
    }

    if (error || !contest) {
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
                                href="/welcome"
                                className="px-4 py-2 text-sm font-medium text-white bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg hover:bg-[#2A2A2A] transition-colors"
                            >
                                Back to Home
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

                    <div className="text-center max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-4">No Active Battle</h2>
                        <p className="text-gray-400 mb-8">
                            There are no active battles at the moment. Check back later!
                        </p>
                        <Link
                            href="/welcome"
                            className="inline-block px-8 py-3 bg-[#67CE67] text-black font-medium rounded-lg hover:bg-[#5AB85A] transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        )
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
                            href="/welcome"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg hover:bg-[#2A2A2A] transition-colors"
                        >
                            Back to Home
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
                    {/* Contest Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-4">{contest.name}</h2>
                        <div className="flex items-center justify-center gap-4">
                            <span className="px-3 py-1 bg-[#67CE67] text-black text-sm rounded-lg font-medium">
                                {contest.status.replace("_", " ").toUpperCase()}
                            </span>
                            <span className="text-gray-400">
                                Started {new Date(contest.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Battle Arena */}
                    <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-8 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                            {/* Creator One */}
                            <div className="text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-[#67CE67] to-[#5AB85A] rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-black">
                                        {contest.participants[0]?.handle.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{contest.participants[0]?.handle}</h3>
                                <p className="text-gray-400 text-sm font-mono break-all">
                                    {contest.participants[0]?.walletAddress}
                                </p>
                                {contest.participants[0]?.zoraProfile && (
                                    <a
                                        href={contest.participants[0].zoraProfile}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-2 text-[#67CE67] hover:text-[#5AB85A] text-sm"
                                    >
                                        View Zora Profile
                                    </a>
                                )}
                            </div>

                            {/* VS Divider */}
                            <div className="text-center">
                                <div className="text-4xl font-bold text-[#67CE67] mb-4">VS</div>
                                <div className="h-px bg-[#2A2A2A] w-full"></div>
                            </div>

                            {/* Creator Two */}
                            <div className="text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-[#FF6B6B] to-[#FF5252] rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">
                                        {contest.participants[1]?.handle.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{contest.participants[1]?.handle}</h3>
                                <p className="text-gray-400 text-sm font-mono break-all">
                                    {contest.participants[1]?.walletAddress}
                                </p>
                                {contest.participants[1]?.zoraProfile && (
                                    <a
                                        href={contest.participants[1].zoraProfile}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-2 text-[#67CE67] hover:text-[#5AB85A] text-sm"
                                    >
                                        View Zora Profile
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Battle Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Battle Progress</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Deposits</span>
                                    <span className="text-[#67CE67]">Pending</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Content Submission</span>
                                    <span className="text-yellow-400">Waiting</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Battle Phase</span>
                                    <span className="text-gray-500">Not Started</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-6">
                            <h3 className="text-lg font-bold text-white mb-4">How to Participate</h3>
                            <div className="space-y-2 text-sm text-gray-400">
                                <p>• Watch the creators compete in real-time</p>
                                <p>• Vote for your favorite content when battle starts</p>
                                <p>• Engage with the community during the battle</p>
                                <p>• See live results and winner announcement</p>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="text-center">
                        <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-8">
                            <h3 className="text-2xl font-bold text-white mb-4">Battle Starting Soon!</h3>
                            <p className="text-gray-400 mb-6">
                                Creators are preparing their content. The battle will begin once both participants have
                                made their deposits and submitted their content.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button className="px-6 py-3 bg-[#67CE67] text-black font-medium rounded-lg hover:bg-[#5AB85A] transition-colors">
                                    Get Notified
                                </button>
                                <button className="px-6 py-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-medium rounded-lg hover:bg-[#2A2A2A] transition-colors">
                                    Share Battle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
