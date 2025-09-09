"use client"

import { usePrivy } from "@privy-io/react-auth"
import Image from "next/image"
import { useState } from "react"
import blitzLogo from "../assets/blitzLogo.svg"
import exportIcon from "../assets/export.svg"
import infoIcon from "../assets/info.svg"
import { InfoDrawer } from "./InfoDrawer"
import { ShareDrawer } from "./ShareDrawer"
import { Button } from "./ui/button"

export function Header() {
    const { ready, authenticated, user, logout } = usePrivy()
    const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false)
    const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false)

    return (
        <>
            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Image src={blitzLogo} alt="Blitz Logo" width={44} height={44} />
                    <h1
                        className="font-dela-gothic-one text-2xl font-bold"
                        style={{
                            color: "white",
                            WebkitTextStroke: "1px #1C7807",
                            letterSpacing: "0.1em",
                        }}
                    >
                        BLITZ
                    </h1>
                </div>

                {/* Center buttons on larger screens */}
                <div className="hidden md:flex items-center space-x-6">
                    <button 
                        onClick={() => setIsInfoDrawerOpen(true)}
                        className="text-[#124D04] font-medium hover:text-[#67CE67] transition-colors"
                    >
                        How to play?
                    </button>
                    <button 
                        onClick={() => setIsShareDrawerOpen(true)}
                        className="text-[#124D04] font-medium hover:text-[#67CE67] transition-colors"
                    >
                        Share
                    </button>
                </div>

                {/* Mobile icons and logout button */}
                <div className="flex items-center space-x-2">
                    {/* Mobile only icons */}
                    <button onClick={() => setIsInfoDrawerOpen(true)} className="md:hidden">
                        <Image src={infoIcon} alt="info" width={24} height={24} />
                    </button>
                    <button onClick={() => setIsShareDrawerOpen(true)} className="md:hidden">
                        <Image src={exportIcon} alt="export" width={24} height={24} />
                    </button>
                    
                    {/* Logout button - always at the end */}
                    {ready && authenticated && user ? <Button onClick={logout}>Logout</Button> : null}
                </div>
            </div>

            <InfoDrawer isOpen={isInfoDrawerOpen} onClose={() => setIsInfoDrawerOpen(false)} />

            <ShareDrawer isOpen={isShareDrawerOpen} onClose={() => setIsShareDrawerOpen(false)} />
        </>
    )
}
