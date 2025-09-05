"use client"

import { useMemo } from "react"
import { createWalletClient, custom } from "viem"
import { useAccount } from "wagmi"
import { getPublicClient, type SupportedChainId } from "@/lib/viem-clients"

export const useViemClient = () => {
    const { connector, chainId } = useAccount()

    const publicClient = useMemo(() => {
        if (!chainId) return null
        return getPublicClient(chainId as SupportedChainId)
    }, [chainId])

    const walletClient = useMemo(() => {
        if (!connector?.getProvider || !chainId) return null

        return createWalletClient({
            transport: custom(connector.getProvider()),
        })
    }, [connector, chainId])

    return {
        publicClient,
        walletClient,
        chainId,
    }
}
