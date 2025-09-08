import { createConfig, http } from "wagmi"
import { anvil, base, baseSepolia } from "wagmi/chains"

export const wagmiConfig = createConfig({
    chains: [base, baseSepolia, anvil],
    transports: {
        [base.id]: http(),
        [baseSepolia.id]: http(),
        [anvil.id]: http(),
    },
})