"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useAtomValue } from "jotai"
import Image from "next/image"
import blitzLogo from "@/assets/blitzLogo.svg"
import { compoundUserAtom } from "@/atoms/userAtoms"
import { AuthGuard } from "@/components/AuthGuard"

export default function WelcomePage() {
    return (
        <AuthGuard>
            <Welcome />
        </AuthGuard>
    )
}

function Welcome() {
    const { logout } = usePrivy()
    const BlitzUser = useAtomValue(compoundUserAtom)

    const { auth, profile, loading, errors } = BlitzUser

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
            </div>
        </div>
    )
}
