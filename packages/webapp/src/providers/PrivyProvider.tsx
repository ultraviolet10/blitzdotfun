"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";

interface PrivyProviderWrapperProps {
  children: ReactNode;
}

export function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  return (
    <PrivyProvider
      appId={
        process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmecq0iuh000lkz0b4i395ym9"
      }
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#67CE67",
        },
        loginMethodsAndOrder: {
          primary: [
            "privy:clpgf04wn04hnkw0fv1m11mnb",
            "coinbase_wallet",
            "phantom",
          ],
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
