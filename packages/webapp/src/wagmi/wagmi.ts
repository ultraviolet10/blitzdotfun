import { createConfig } from "@privy-io/wagmi"
import { chains, transports } from "@/lib/viem-clients"

export const config = createConfig({
    chains,
    transports,
})
