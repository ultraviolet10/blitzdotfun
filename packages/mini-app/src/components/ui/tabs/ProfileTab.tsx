"use client";

import { useMiniApp } from "@neynar/react";
import { useQuickAuth } from "~/hooks/useQuickAuth";
import { useAccount, useChainId } from "wagmi";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { truncateAddress } from "~/lib/truncateAddress";
import sdk from "@farcaster/miniapp-sdk";

/**
 * ProfileTab component displays user profile information and mini app context.
 *
 * This component provides a user-friendly view of the current user's profile
 * and relevant mini app context information, including:
 * - User profile details (avatar, name, username, FID)
 * - Authentication status
 * - Client information and capabilities
 * - Mini app configuration
 *
 * @example
 * ```tsx
 * <ProfileTab />
 * ```
 */
export function ProfileTab() {
  const { context } = useMiniApp();
  const { status } = useQuickAuth();

  // Wallet hooks
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const chainId = useChainId();
  const solanaWallet = useSolanaWallet();
  const { publicKey: solanaPublicKey } = solanaWallet;

  return (
    <div className="space-y-6 px-6 w-full max-w-md mx-auto">
      {/* User Profile Section */}
      {context?.user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            👤 Profile
          </h2>

          <div className="flex items-center space-x-4 mb-4">
            {context.user.pfpUrl && (
              <img
                src={context.user.pfpUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-primary"
              />
            )}
            <div className="flex-1">
              <h3
                className="font-bold text-lg hover:underline cursor-pointer text-gray-900 dark:text-gray-100"
                onClick={() =>
                  sdk.actions.viewProfile({ fid: context.user.fid })
                }
              >
                {context.user.displayName || context.user.username}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                @{context.user.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                FID: {context.user.fid}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          💰 Wallet
        </h2>

        <div className="space-y-3">
          {/* EVM Wallet */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                EVM Wallet
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isEvmConnected
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {isEvmConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            {evmAddress && (
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Address:{" "}
                  <span className="font-mono">
                    {truncateAddress(evmAddress)}
                  </span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Chain ID: <span className="font-mono">{chainId}</span>
                </p>
              </div>
            )}
          </div>

          {/* Solana Wallet */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Solana Wallet
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  solanaPublicKey
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {solanaPublicKey ? "Connected" : "Disconnected"}
              </span>
            </div>
            {solanaPublicKey && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Address:{" "}
                <span className="font-mono">
                  {truncateAddress(solanaPublicKey.toString())}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Status */}
      {/* <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          🔐 Authentication
        </h2>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            status === 'authenticated' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
          }`}>
            {status === 'authenticated' ? '✅ Authenticated' : '⏳ Not Authenticated'}
          </span>
        </div>
      </div> */}

      {/* Client Information */}
      {/* {context?.client && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
            📱 Client Info
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Platform:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {context.client.platformType || 'Unknown'}
              </span>
            </div>
            
            {context.client.clientFid && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Client FID:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {context.client.clientFid}
                </span>
              </div>
            )}
            
            {context.client.safeAreaInsets && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Safe Area:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Top:</span>
                    <span>{context.client.safeAreaInsets.top}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bottom:</span>
                    <span>{context.client.safeAreaInsets.bottom}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Left:</span>
                    <span>{context.client.safeAreaInsets.left}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Right:</span>
                    <span>{context.client.safeAreaInsets.right}px</span>
                  </div>
                </div>
              </div>
            )}

            {(context.client as any).features && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features:</p>
                <div className="space-y-1">
                  {Object.entries((context.client as any).features).map(([feature, enabled]) => (
                    <div key={feature} className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        enabled 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {enabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )} */}

      {/* Location Information */}
      {/* {context?.user?.location && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
            📍 Location
          </h2>
          
          <div className="space-y-2">
            {context.user.location.placeId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Place ID:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {context.user.location.placeId}
                </span>
              </div>
            )}
            {context.user.location.description && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Description:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {context.user.location.description}
                </span>
              </div>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
}
