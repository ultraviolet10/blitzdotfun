/**
 * CONTEST HOOK
 *
 * Hook for managing contest state and checking user participation.
 * Integrates with the compound user state system.
 */

import { useAtom } from "jotai"
import { useCallback, useEffect, useState, useRef } from "react"
import { compoundUserAtom } from "@/atoms/userAtoms"
import type { ZoraProfileData } from "@/lib/zora"

interface Contest {
    contestId: string
    name: string
    status: string
    participants: Array<{
        handle: string
        walletAddress: string
        zoraProfile?: string
        zoraProfileData?: ZoraProfileData | null
    }>
    createdAt: string
    battleStartTime?: string | null
    battleEndTime?: string | null
    contentDeadline?: string | null
}

interface ContestParticipation {
    isParticipant: boolean
    contest: Contest | null
    participantRole?: "participant_one" | "participant_two"
    loading: boolean
    error: string | null
}

export function useContest() {
    const [blitzUser] = useAtom(compoundUserAtom)
    const [contestState, setContestState] = useState<ContestParticipation>({
        isParticipant: false,
        contest: null,
        loading: false,
        error: null,
    })
    
    // Cache to prevent redundant API calls
    const lastWalletAddress = useRef<string | null>(null)
    const lastFetchTime = useRef<number>(0)
    const isCurrentlyFetching = useRef<boolean>(false)
    
    // Cache duration: 30 seconds
    const CACHE_DURATION = 30000

    const checkContestParticipation = useCallback(async () => {
        const currentWallet = blitzUser.auth.walletAddress?.toLowerCase()
        const now = Date.now()
        
        // Don't fetch if no wallet address
        if (!currentWallet) {
            setContestState({
                isParticipant: false,
                contest: null,
                loading: false,
                error: null,
            })
            return
        }

        // Prevent redundant calls: same wallet + recent fetch + not currently fetching
        if (
            currentWallet === lastWalletAddress.current &&
            now - lastFetchTime.current < CACHE_DURATION &&
            !isCurrentlyFetching.current
        ) {
            return
        }

        // Prevent concurrent fetches
        if (isCurrentlyFetching.current) {
            return
        }

        try {
            isCurrentlyFetching.current = true
            setContestState((prev) => ({ ...prev, loading: true, error: null }))

            // Fetch active contest
            const response = await fetch("/api/contests/active")
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch contest")
            }

            // Update cache tracking
            lastWalletAddress.current = currentWallet
            lastFetchTime.current = now

            if (!data.contest) {
                setContestState({
                    isParticipant: false,
                    contest: null,
                    loading: false,
                    error: null,
                })
                return
            }

            const contest = data.contest
            const userWallet = currentWallet

            // Debug logging
            console.log('Contest participants:', contest.participants?.map((p: { walletAddress: string }) => p.walletAddress))
            console.log('User wallet:', userWallet)
            console.log('Contest status:', contest.status)
            console.log('Contest ID:', contest.contestId)

            // Check if user is a participant
            const participantIndex = contest.participants?.findIndex(
                (p: { walletAddress: string }) => p.walletAddress.toLowerCase() === userWallet,
            ) ?? -1

            if (participantIndex === -1) {
                console.log('User is NOT a participant - showing spectator view')
                setContestState({
                    isParticipant: false,
                    contest,
                    loading: false,
                    error: null,
                })
                return
            }

            const participantRole = participantIndex === 0 ? "participant_one" : "participant_two"
            console.log('User IS a participant - role:', participantRole)

            setContestState({
                isParticipant: true,
                contest,
                participantRole,
                loading: false,
                error: null,
            })
        } catch (error) {
            setContestState((prev) => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }))
        } finally {
            isCurrentlyFetching.current = false
        }
    }, [blitzUser.auth.walletAddress])

    // Check contest participation when wallet address changes, but with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            checkContestParticipation()
        }, 100) // Small delay to prevent rapid successive calls

        return () => clearTimeout(timeoutId)
    }, [checkContestParticipation])

    return {
        ...contestState,
        refetch: checkContestParticipation,
    }
}
