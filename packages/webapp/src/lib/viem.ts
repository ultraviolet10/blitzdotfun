import { createPublicClient, createWalletClient, http } from 'viem'
import { anvil, base, baseSepolia } from 'viem/chains'

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
}

export const walletClients = {
  [base.id]: createWalletClient({
    chain: base,
    transport: http(),
  }),
  [baseSepolia.id]: createWalletClient({
    chain: baseSepolia,
    transport: http(),
  }),
  [anvil.id]: createWalletClient({
    chain: anvil,
    transport: http(),
  }),
}

type SupportedChainId = typeof base.id | typeof baseSepolia.id | typeof anvil.id

export const getPublicClient = (chainId: SupportedChainId) => {
    const client = publicClients[chainId]
    if (!client) {
      throw new Error(`Public client not found for chain ID: ${chainId}`)
    }
    return client
}
  
export const getWalletClient = (chainId: SupportedChainId) => {
    const client = walletClients[chainId]
    if (!client) {
      throw new Error(`Wallet client not found for chain ID: ${chainId}`)
    }
    return client
}
