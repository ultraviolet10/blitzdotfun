import { deployment } from "@blitzdotfun/blitz-contracts/local"
import { useAtomValue } from "jotai"
import { useState } from "react"
import { compoundUserAtom } from "@/atoms/userAtoms"

const WelcomeCard = () => {
    const blitzUser = useAtomValue(compoundUserAtom)
    const { profile } = blitzUser
    const [copied, setCopied] = useState(false)

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(deployment.Blitz)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy address:", err)
        }
    }

    return (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-8 max-w-2xl mx-auto">
            <div className="space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Ready to Battle?</h2>
                    <p className="text-gray-400">Follow these steps to enter the contest</p>
                </div>

        {/* Steps */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[#67CE67] rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">1</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                Withdraw Creator Coins
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Withdraw 10% of{" "}
                <a
                  href={`https://zora.co/${profile.data?.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#67CE67] hover:text-[#5AB85A] underline font-medium"
                >
                  ${profile.data?.username}
                </a>{" "}
                coins into your Zora wallet to participate in the battle.
              </p>
            </div>
          </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-[#67CE67] rounded-full flex items-center justify-center">
                                <span className="text-black font-bold text-sm">2</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-white">Send to Battle Contract</h3>
                            <p className="text-gray-300 leading-relaxed">
                                Send your coins to the Blitz battle contract to lock in your entry:
                            </p>
                            <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#3A3A3A]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Contract Address</p>
                                        <p className="text-[#67CE67] font-mono text-sm break-all">{deployment.Blitz}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyAddress}
                                        className="ml-4 px-3 py-2 bg-[#67CE67] text-black text-sm font-medium rounded hover:bg-[#5AB85A] transition-colors flex-shrink-0"
                                    >
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

          {/* Step 3 */}
          {/*
            - they need to copy their content coin address in here, and send a request to 
              /check-creator-token here.
            - we (probably) need to fetch how much they own and compute 10% of the same in order to 
              cross check. 
           */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[#2A2A2A] rounded-full flex items-center justify-center border border-[#3A3A3A]">
                <span className="text-gray-400 font-bold text-sm">3</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                Create Your Content
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Once your deposit is confirmed, create and submit your battle content. 
                You&apos;ll have a limited time to showcase your creativity!
              </p>
            </div>
          </div>
        </div>

                {/* Status */}
                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#3A3A3A]">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        <p className="text-sm text-gray-300">Waiting for your deposit to begin the battle...</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WelcomeCard
