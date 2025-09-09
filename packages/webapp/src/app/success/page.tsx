"use client"

import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { RoutingWrapper } from "@/components/RoutingWrapper"
import { Header } from "@/components/Header"

export default function SuccessPage() {
    return (
        <AuthGuard>
            <RoutingWrapper>
                <Success />
            </RoutingWrapper>
        </AuthGuard>
    )
}

function Success() {
    const router = useRouter()

    const handleContinue = () => {
        // Navigate to the next step or battle page
        router.push("/post") // Adjust route as needed
    }

    return (
        <div className="min-h-screen size-full flex flex-col">
            <Header />

            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                <div className="w-full max-w-xl text-center space-y-6">
                    {/* Success Icon with Sparkles */}
                    <div className="relative flex justify-center">
                        {/* Sparkles */}
                        <div className="absolute -top-2 -left-2">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                    d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
                                    fill="#9EE685"
                                />
                            </svg>
                        </div>
                        <div className="absolute -top-1 -right-1">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path
                                    d="M6 0L7.125 4.875L12 6L7.125 7.125L6 12L4.875 7.125L0 6L4.875 4.875L6 0Z"
                                    fill="#9EE685"
                                />
                            </svg>
                        </div>
                        <div className="absolute -bottom-1 -left-1">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path
                                    d="M5 0L5.9375 4.0625L10 5L5.9375 5.9375L5 10L4.0625 5.9375L0 5L4.0625 4.0625L5 0Z"
                                    fill="#9EE685"
                                />
                            </svg>
                        </div>
                        <div className="absolute -bottom-2 -right-2">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path
                                    d="M7 0L8.3125 5.6875L14 7L8.3125 8.3125L7 14L5.6875 8.3125L0 7L5.6875 5.6875L7 0Z"
                                    fill="#9EE685"
                                />
                            </svg>
                        </div>

                        {/* Main Checkmark Circle */}
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "#1C7807" }}
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M9 12L11 14L15 10"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Success Message */}
                    <div className="space-y-2">
                        <h2
                            className="font-dela-gothic-one text-4xl font-bold"
                            style={{
                                color: "#F1F1F1",
                                WebkitTextStroke: "1px #1C7807",
                                letterSpacing: "0.1em",
                            }}
                        >
                            DEPOSIT SUCCESSFUL
                        </h2>
                        <p
                            className="font-schibsted-grotesk font-medium text-lg"
                            style={{
                                color: "#124D04",
                            }}
                        >
                            You&apos;ve successfully entered the contest.
                        </p>
                    </div>

                    {/* Continue Button */}
                    <button
                        className="font-schibsted-grotesk w-full px-6 py-3 text-base font-semibold rounded-full shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
                        style={{
                            color: "#124D04",
                            background: "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
                        }}
                        onClick={handleContinue}
                    >
                        Continue
                    </button>
                </div>
            </div>

            <div className="pb-8 text-center">
                <h3
                    className="font-dela-gothic-one text-2xl font-bold opacity-60"
                    style={{
                        color: "#F1F1F1",
                        WebkitTextStroke: "1px #1C7807",
                        letterSpacing: "0.1em",
                    }}
                >
                    THE ARENA FOR CREATOR COINS.
                </h3>
            </div>
        </div>
    )
}
