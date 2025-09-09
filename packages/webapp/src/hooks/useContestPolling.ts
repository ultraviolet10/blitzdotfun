/**
 * CONTEST POLLING HOOK
 *
 * Hook for real-time contest status updates using polling.
 * Automatically polls the contest API and updates the useContest hook data.
 */

import { useEffect, useRef } from "react"
import { useContest } from "./useContest"

interface UseContestPollingOptions {
    enabled?: boolean
    interval?: number // milliseconds
    onStatusChange?: (oldStatus: string | null, newStatus: string | null) => void
}

export function useContestPolling(options: UseContestPollingOptions = {}) {
    const {
        enabled = true,
        interval = 5000, // 5 seconds default
        onStatusChange
    } = options
    
    const { contest, refetch } = useContest()
    const lastStatus = useRef<string | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    
    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }
        
        const pollContest = async () => {
            try {
                await refetch()
            } catch (error) {
                console.error('Contest polling error:', error)
            }
        }
        
        // Start polling
        intervalRef.current = setInterval(pollContest, interval)
        
        // Cleanup on unmount or when disabled
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [enabled, interval, refetch])
    
    // Detect status changes and call callback
    useEffect(() => {
        const currentStatus = contest?.status || null
        
        if (lastStatus.current !== currentStatus) {
            if (onStatusChange && lastStatus.current !== null) {
                onStatusChange(lastStatus.current, currentStatus)
            }
            lastStatus.current = currentStatus
        }
    }, [contest?.status, onStatusChange])
    
    return {
        contest,
        isPolling: enabled && intervalRef.current !== null
    }
}
