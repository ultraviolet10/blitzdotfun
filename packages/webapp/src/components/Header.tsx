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

                <div className="flex items-center space-x-2">
                    <button type="button" onClick={() => setIsInfoDrawerOpen(true)}>
                        <Image src={infoIcon} alt="info" width={24} height={24} />
                    </button>
                    <button type="button" onClick={() => setIsShareDrawerOpen(true)}>
                        <Image src={exportIcon} alt="export" width={24} height={24} />
                    </button>
                    {ready && authenticated && user ? <Button onClick={logout}>Logout</Button> : null}
                </div>
            </div>

            <InfoDrawer isOpen={isInfoDrawerOpen} onClose={() => setIsInfoDrawerOpen(false)} />

            <ShareDrawer isOpen={isShareDrawerOpen} onClose={() => setIsShareDrawerOpen(false)} />
        </>
    )
}
