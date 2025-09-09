"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { authDataAtom } from "@/atoms/userAtoms";
import { useAuthSync } from "@/hooks/useAuthSync";
import { useZora } from "@/hooks/useZora";
import { getWalletAddress, getWalletType, isZoraLogin } from "@/lib/userUtils";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [, setAuthData] = useAtom(authDataAtom);
  const { fetchZoraProfile } = useZora();

  // Initialize auth sync - this will automatically sync to database when BlitzUser state changes
  useAuthSync();

  /**
   * First useEffect: Handle authentication redirects
   * This runs whenever Privy's auth state changes and redirects
   * unauthenticated users to the login page.
   */
  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/");
    }
  }, [ready, authenticated, router]);

  /**
   * 1. Extract wallet info using our utility functions
   * 2. Update the global auth state via Jotai atoms
   * 3. - start fetching Zora profile data in the background
   *
   * This means by the time the user navigates to /welcome, their Zora
   * data is already loading or loaded.
   */
  useEffect(() => {
    if (ready && authenticated && user) {
      const walletAddress = getWalletAddress(user);
      const walletType = getWalletType(user);
      const isZora = isZoraLogin(user);

      // Update auth data in Jotai
      setAuthData({
        user,
        walletAddress,
        walletType,
        isZoraLogin: isZora,
      });

      // Fetch Zora profile if wallet address is available
      if (walletAddress) {
        fetchZoraProfile(walletAddress).catch((error) => {
          console.warn("Failed to fetch Zora profile:", error);
        });
      }
    }
  }, [ready, authenticated, user, setAuthData, fetchZoraProfile]);

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
          <span className="text-[#67CE67]">Loading...</span>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting to login
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
          <span className="text-[#67CE67]">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
