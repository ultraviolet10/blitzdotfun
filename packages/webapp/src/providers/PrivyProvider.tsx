"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

interface PrivyProviderWrapperProps {
  children: ReactNode;
}

export function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  return (
    <PrivyProvider
      appId={process.env.PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#67CE67",
        },
        loginMethodsAndOrder: {
          primary: [
            "privy:clpgf04wn04hnkw0fv1m11mnb",
            "coinbase_wallet",
            "metamask",
            "phantom",
            "farcaster",
            "twitter",
          ],
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
