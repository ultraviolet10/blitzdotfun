import { createPublicClient, createWalletClient, http, } from "viem";
import { base } from "viem/chains";


const blitzPublicClient = createPublicClient({
    chain: base,
    transport: http(),
})

const blitzWalletClient = createWalletClient({
    chain: base,
    transport: http(base.rpcUrls.default.http[0])
})

export { blitzPublicClient, blitzWalletClient }