"use client";

import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import blitzLogo from "@/assets/blitzLogo.svg";

export default function Home() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  const handleLogin = () => {
    login();
  };

  React.useEffect(() => {
    if (authenticated) {
      router.replace("/dashboard");
    }
  }, [authenticated, router]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Hero Content */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Image src={blitzLogo} alt="Blitz Logo" width={50} height={50} />
            <h1 className="text-5xl lg:text-6xl font-bold text-[#67CE67] leading-tight">
              Blitz
            </h1>
          </div>

          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#67CE67] leading-tight">
              Creators battle.
            </h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-[#67CE67] leading-tight">
              Support by trading.
            </h3>
            <div className="space-y-2">
              <p className="text-2xl lg:text-3xl font-medium text-[#67CE67] leading-tight">
                Win together.
              </p>
              <p className="text-2xl lg:text-3xl font-medium text-[#67CE67] leading-tight">
                Win big.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-[#1A1A1A] border-[#2A2A2A]">
            <CardHeader className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <Image
                  src={blitzLogo}
                  alt="Blitz Logo"
                  width={60}
                  height={60}
                />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl text-[#67CE67]">
                  Welcome to Blitz
                </CardTitle>
                <CardDescription className="text-[#67CE67] opacity-80">
                  Connect your wallet to start trading and supporting creators
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={handleLogin}
                disabled={!ready || authenticated}
                className="w-full h-12 text-lg font-semibold bg-[#67CE67] hover:bg-[#58B958] text-black"
                size="lg"
              >
                {!ready ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  "Connect your account"
                )}
              </Button>

              <Separator className="bg-[#2A2A2A]" />

              <div className="text-center">
                <p className="text-xs text-[#67CE67] opacity-80">
                  By connecting, you agree to our Terms of Service and Privacy
                  Policy
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
