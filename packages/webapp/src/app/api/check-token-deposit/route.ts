import { deployment } from "@blitzdotfun/blitz-contracts/local"
import { type NextRequest, NextResponse } from "next/server"
import type { Address } from "viem"
import { base } from "viem/chains"
import { getPublicClient } from "@/lib/viem-clients"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const tokenAddress = searchParams.get("tokenAddress")
        const userAddress = searchParams.get("userAddress")

        if (!tokenAddress || !userAddress) {
            return NextResponse.json({ error: "Missing tokenAddress or userAddress" }, { status: 400 })
        }

        const publicClient = getPublicClient(base.id)

        const balance = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: [
                {
                    inputs: [{ name: "account", type: "address" }],
                    name: "balanceOf",
                    outputs: [{ name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function",
                },
            ],
            functionName: "balanceOf",
            args: [deployment.Blitz as Address],
        })

        return NextResponse.json({
            balance: balance.toString(),
            hasBalance: balance > 0n,
        })
    } catch (error) {
        console.error("Error checking token balance:", error)
        return NextResponse.json({ error: "Failed to check token balance" }, { status: 500 })
    }
}
