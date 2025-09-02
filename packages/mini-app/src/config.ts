import { mainnet, sepolia, base, baseSepolia, zora } from "wagmi/chains";
import { createConfig, http } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { toPrivyWallet } from "@privy-io/cross-app-connect/rainbow-kit";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Zora Wallet",
      wallets: [
        toPrivyWallet({
          id: "clpgf04wn04hnkw0fv1m11mnb", // Your Zora app ID
          name: "Zora",
          iconUrl: "https://privy-assets-public.s3.amazonaws.com/zora.png",
        }),
      ],
    },
  ],
  {
    appName: "Blitz Mini App",
    projectId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
  }
);

export const config = createConfig({
  chains: [mainnet, sepolia, base, baseSepolia, zora],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [zora.id]: http(),
  },
  connectors,
  ssr: false,
});
