"use client"

import { usePrivy } from "@privy-io/react-auth"
import Image from "next/image"
import { useState } from "react"
import blitzLogo from "@/assets/blitzLogo.svg"
import { AuthGuard } from "@/components/AuthGuard"

export default function DashboardPage() {
    return (
        <AuthGuard>
            <Dashboard />
        </AuthGuard>
    )
}

function Dashboard() {
    const { user, logout } = usePrivy()
    const [_showDebug, _setShowDebug] = useState(true)

    // Helper function to get wallet address from different sources
    const getWalletAddress = () => {
        // First check direct wallet connection
        if (user?.wallet?.address) {
            return user.wallet.address
        }

        // Check for cross_app linked accounts (Zora login)
        const crossAppAccount = user?.linkedAccounts?.find((account) => account.type === "cross_app")
        if (crossAppAccount?.smartWallets?.[0]?.address) {
            return crossAppAccount.smartWallets[0].address
        }

        return null
    }

    // Helper function to get wallet type
    const getWalletType = () => {
        if (user?.wallet?.walletClientType) {
            return user.wallet.walletClientType
        }

        const crossAppAccount = user?.linkedAccounts?.find((account) => account.type === "cross_app")
        if (crossAppAccount) {
            return "Cross-app (Smart Wallet)"
        }

        return "Unknown"
    }

    const walletAddress = getWalletAddress()
    const walletType = getWalletType()

    return (
        <div className="min-h-screen bg-[#121212]">
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

                <main className="max-w-4xl mx-auto space-y-8">
                    {/* User Profile Section */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                        <h2 className="text-2xl font-semibold text-[#67CE67] mb-6">User Profile</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-sm font-medium text-[#67CE67] block mb-1">
                                        Wallet Address
                                    </span>
                                    <p className="text-white bg-[#0A0A0A] p-3 rounded-lg font-mono text-sm break-all">
                                        {walletAddress || "Not connected"}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-[#67CE67] block mb-1">Wallet Type</span>
                                    <p className="text-white bg-[#0A0A0A] p-3 rounded-lg">{walletType}</p>
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-[#67CE67] block mb-1">
                                        Wallet Connected
                                    </span>
                                    <p className="text-white bg-[#0A0A0A] p-3 rounded-lg">
                                        {walletAddress ? "Yes" : "No"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <span className="text-sm font-medium text-[#67CE67] block mb-1">User ID</span>
                                    <p className="text-white bg-[#0A0A0A] p-3 rounded-lg font-mono text-sm break-all">
                                        {user?.id || "Not available"}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-[#67CE67] block mb-1">Created At</span>
                                    <p className="text-white bg-[#0A0A0A] p-3 rounded-lg">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleString() : "Not available"}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-[#67CE67] block mb-1">
                                        Linked Accounts
                                    </span>
                                    <p className="text-white bg-[#0A0A0A] p-3 rounded-lg">
                                        {user?.linkedAccounts?.length || 0} account(s)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
