import { createPublicClient, http } from "viem"
import { anvil, base, baseSepolia } from "viem/chains"

export const chains = [base, baseSepolia, anvil] as const

export const transports = {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [anvil.id]: http(),
} as const

export const publicClients = {
    [base.id]: createPublicClient({
        chain: base,
        transport: http(),
    }),
    [baseSepolia.id]: createPublicClient({
        chain: baseSepolia,
        transport: http(),
    }),
    [anvil.id]: createPublicClient({
        chain: anvil,
        transport: http(),
    }),
} as const

export const getPublicClient = (chainId: keyof typeof publicClients) => {
    return publicClients[chainId]
}

export type SupportedChainId = keyof typeof publicClients
