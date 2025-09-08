"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type InfoDrawerProps = {
    isOpen: boolean
    onClose: () => void
}

export function InfoDrawer({ isOpen, onClose }: InfoDrawerProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="font-schibsted-grotesk max-w-2xl max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: "#161616" }}
            >
                <DialogHeader className="border-b border-gray-800 pb-6">
                    <DialogTitle className="text-xl font-bold text-white text-left">
                        How to Play Blitz?
                    </DialogTitle>
                    <DialogDescription className="text-sm text-left text-gray-300">
                        Welcome to ⚡ Blitz!
                    </DialogDescription>
                </DialogHeader>

                <div className="pt-6">
                    <div className="space-y-6 text-white">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center">
                                <span className="text-white mr-2">1.</span>
                                Creators battle.
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed ml-6">
                                Each creator stakes 10% of their market cap into the prize pool.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center">
                                <span className="text-white mr-2">2.</span>
                                You support by trading.
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed ml-6">
                                Buy your favorite creator&apos;s coin on Zora during the battle to back them. The more
                                you trade, the stronger your support — and your chance to win.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                <span className="text-white mr-2">3.</span>
                                Winners take the prize.
                            </h3>
                            <div className="ml-6 space-y-2">
                                <div className="flex items-start">
                                    <span className="text-white mr-2 text-sm">•</span>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        The winning creator receives 60% of the total pool.
                                    </p>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-2 text-sm">•</span>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        The top 10 supporters share the remaining 40%, based on their contribution.
                                    </p>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-2 text-sm">•</span>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        The losing creator loses their stake.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 pt-4">
                            <p className="text-gray-300 text-sm leading-relaxed mb-3">
                                There&apos;s no limit to how many battles you can join or how much you can trade.
                            </p>
                            <p className="text-white text-sm font-medium">
                                Your trade is your vote. Back creators, grow their market cap, and win big together.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
