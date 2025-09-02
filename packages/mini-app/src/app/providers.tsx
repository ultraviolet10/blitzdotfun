"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { AuthKitProvider } from "@farcaster/auth-kit";
import { MiniAppProvider } from "@neynar/react";
import { PrivyProvider } from "@privy-io/react-auth";
import { SafeFarcasterSolanaProvider } from "~/components/providers/SafeFarcasterSolanaProvider";
import { ANALYTICS_ENABLED, RETURN_URL } from "~/lib/constants";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const solanaEndpoint =
    process.env.SOLANA_RPC_ENDPOINT || "https://solana-rpc.publicnode.com";

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    console.error(
      "NEXT_PUBLIC_PRIVY_APP_ID is not set in environment variables"
    );
  }

  return (
    <SessionProvider session={session}>
      <PrivyProvider
        appId={privyAppId || ""}
        config={{
          loginMethodsAndOrder: {
            primary: ["privy:clpgf04wn04hnkw0fv1m11mnb"],
          },
        }}
      >
        <WagmiProvider>
          <MiniAppProvider
            analyticsEnabled={ANALYTICS_ENABLED}
            backButtonEnabled={true}
            returnUrl={RETURN_URL}
          >
            <SafeFarcasterSolanaProvider endpoint={solanaEndpoint}>
              <AuthKitProvider config={{}}>{children}</AuthKitProvider>
            </SafeFarcasterSolanaProvider>
          </MiniAppProvider>
        </WagmiProvider>
      </PrivyProvider>
    </SessionProvider>
  );
}
