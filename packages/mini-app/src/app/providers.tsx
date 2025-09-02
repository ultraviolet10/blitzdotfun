"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { AuthKitProvider } from "@farcaster/auth-kit";
import { MiniAppProvider } from "@neynar/react";
import { ANALYTICS_ENABLED, RETURN_URL } from "~/lib/constants";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import React from "react";
import { config } from "~/config";

const queryClient = new QueryClient();

export function Providers({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider session={session}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <MiniAppProvider
              analyticsEnabled={ANALYTICS_ENABLED}
              backButtonEnabled={true}
              returnUrl={RETURN_URL}
            >
              <AuthKitProvider config={{}}>{children}</AuthKitProvider>
            </MiniAppProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
