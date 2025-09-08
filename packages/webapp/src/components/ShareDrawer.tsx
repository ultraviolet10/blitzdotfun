"use client"

import Image from "next/image"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import FarcasterIcon from "../assets/farcaster.svg"
import LinkIcon from "../assets/link.svg"
import TelegramIcon from "../assets/telegram.svg"
import XIcon from "../assets/x.svg"

type ShareDrawerProps = {
    isOpen: boolean
    onClose: () => void
}

export function ShareDrawer({ isOpen, onClose }: ShareDrawerProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="font-schibsted-grotesk max-w-md max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: "#161616" }}
            >
                <DialogHeader className="border-b border-gray-800 pb-6">
                    <DialogTitle className="text-xl font-bold text-white text-left">
                        Share Battle Card ⚡
                    </DialogTitle>
                    <DialogDescription className="text-sm text-left text-gray-300">
                        Flip Battle Live!
                    </DialogDescription>
                </DialogHeader>

                <div className="pt-6">
                    {/* //TODO: @kshitij-hash Replace with actual battle card */}
                    <div className="mx-auto max-w-xs mb-8">
                        <div className="rounded-[32px] overflow-hidden border border-gray-700 bg-black">
                            <div className="bg-black p-5 relative">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-white text-xl font-bold">Aritra</h3>
                                        <p className="text-gray-400 text-sm">@ultraviolet1000</p>
                                    </div>
                                    <div>
                                        <Image
                                            src="/dj-image.png"
                                            alt="DJ"
                                            width={80}
                                            height={80}
                                            className="w-20 h-20 object-contain"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center items-center relative">
                                <div className="absolute w-16 h-16 bg-[#7BF25D] rounded-full flex items-center justify-center z-10">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M13 2L4.5 12.5H11L10 22L18.5 11.5H12L13 2Z"
                                            fill="black"
                                            stroke="black"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <div className="h-1 w-full bg-[#7BF25D]"></div>
                            </div>

                            <div className="bg-[#FF92C4] p-5 relative">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-black text-xl font-bold">Empress Trash</h3>
                                        <p className="text-gray-800 text-sm">@empresstrash</p>
                                    </div>
                                    <div>
                                        <Image
                                            src="/green-character.png"
                                            alt="Green Character"
                                            width={96}
                                            height={96}
                                            className="w-24 h-24 object-contain"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black py-6 px-4 flex flex-col items-center justify-center">
                                <div className="flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M13 2L4.5 12.5H11L10 22L18.5 11.5H12L13 2Z"
                                            fill="#7BF25D"
                                            stroke="#7BF25D"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span className="text-[#7BF25D] font-bold text-4xl tracking-wider">BLITZ</span>
                                    <svg className="w-8 h-8 ml-3" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M13 2L4.5 12.5H11L10 22L18.5 11.5H12L13 2Z"
                                            fill="#7BF25D"
                                            stroke="#7BF25D"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>

                                <div className="flex items-center justify-between w-full mt-2">
                                    <span className="text-gray-400 text-lg">@sej_here</span>
                                    <span className="text-[#7BF25D] text-lg font-mono">#0001</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* //TODO: @kshitij-hash make them functional, ref to waitlist branch implementation */}
                    <div className="flex justify-around mt-8">
                        <div className="flex flex-col items-center">
                            <button className="w-12 h-12 rounded-full border flex items-center justify-center mb-2">
                                <Image src={LinkIcon.src} alt="Copy link" width={24} height={24} />
                            </button>
                            <span className="text-gray-400 text-xs">Copy link</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <button className="w-12 h-12 rounded-full border flex items-center justify-center mb-2">
                                <Image src={XIcon.src} alt="X post" width={24} height={24} />
                            </button>
                            <span className="text-gray-400 text-xs">X post</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <button className="w-12 h-12 rounded-full border flex items-center justify-center mb-2">
                                <Image src={TelegramIcon.src} alt="Telegram" width={24} height={24} />
                            </button>
                            <span className="text-gray-400 text-xs">Telegram</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <button className="w-12 h-12 rounded-full border flex items-center justify-center mb-2">
                                <Image src={FarcasterIcon.src} alt="Farcaster" width={24} height={24} />
                            </button>
                            <span className="text-gray-400 text-xs">Farcaster</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
