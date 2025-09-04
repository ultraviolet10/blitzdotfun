"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/login");
    }
  }, [ready, authenticated, router]);

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
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
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
          <span className="text-[#67CE67]">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
