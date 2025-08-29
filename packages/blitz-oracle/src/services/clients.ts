import { type Chain, createPublicClient, createWalletClient, http, type Transport, type WalletClient } from "viem"
import { base } from "viem/chains"

const blitzPublicClient = createPublicClient({
    chain: base,
    transport: http(),
})


// todo more type finagling
const blitzWalletClient: WalletClient<Transport, Chain> = createWalletClient({
    chain: base,
    transport: http(base.rpcUrls.default.http[0]),
})

export { blitzPublicClient, blitzWalletClient }
