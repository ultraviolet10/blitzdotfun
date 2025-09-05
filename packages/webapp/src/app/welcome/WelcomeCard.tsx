import { deployment } from "@blitzdotfun/blitz-contracts/local"
import { useAtomValue } from "jotai"
import { compoundUserAtom } from "@/atoms/userAtoms"
import { Card, CardContent } from "@/components/ui/card"

const WelcomeCard = () => {
    const blitzUser = useAtomValue(compoundUserAtom)
    const { profile } = blitzUser

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(deployment.Blitz)
        } catch (err) {
            console.error("Failed to copy address:", err)
        }
    }
    return (
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-lg max-w-md mx-auto">
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-500">Step 1</span>
                        <p className="text-lg font-bold text-black leading-tight">
                            Withdraw $500 worth of{" "}
                            <a
                                href={`https://zora.co/${profile.data?.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                ${profile.data?.username}
                            </a>{" "}
                            into your Zora wallet.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-500">Step 2</span>
                        <p className="text-lg font-bold text-black leading-tight">
                            Send it to{" "}
                            <button
                                type="button"
                                onClick={handleCopyAddress}
                                className="text-green-500 font-bold underline decoration-2 underline-offset-2 hover:text-green-600 cursor-pointer inline"
                            >
                                Blitz.sol
                            </button>{" "}
                            📋 to enter
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default WelcomeCard
