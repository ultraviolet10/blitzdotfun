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
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#121212] text-[#67CE67]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
          <span className="text-[#67CE67]">Loading...</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
