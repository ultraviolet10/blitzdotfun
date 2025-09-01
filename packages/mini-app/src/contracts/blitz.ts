// Contract configuration for Blitz protocol
// This demonstrates the production-grade ABI import pattern

// import {
//   abis,
//   deployment,
// } from "@blitzdotfun/blitz-contracts/local" // Change to /testnet or /mainnet as needed

// import type { Address } from "viem"

// Type-safe contract addresses
// export const contractAddresses = {
//   blitz: deployment.Blitz as Address,
// } as const

// Type-safe ABIs 
// export const contractAbis = {
//   blitz: abis.Blitz,
// } as const

// Export types for use in components
// export type ContractAddresses = typeof contractAddresses
// export type ContractAbis = typeof contractAbis

// Usage example in your components:
// import { contractAddresses, contractAbis } from '@/contracts/blitz'
// import { useReadContract } from 'wagmi'
//
// const { data } = useReadContract({
//   address: contractAddresses.blitz,
//   abi: contractAbis.blitz,
//   functionName: 'battleDuration'
// })