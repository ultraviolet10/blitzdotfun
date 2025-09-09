/**
 * ROUTING HOOK
 *
 * Hook that manages automatic routing based on user type and contest status.
 * Integrates with the contest hook and compound user state.
 */

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { useContest } from "./useContest"
import { determineUserRoute } from "@/lib/routing"
import { useAtom } from "jotai"
import { compoundUserAtom } from "@/atoms/userAtoms"

export function useRouting() {
    const router = useRouter()
    const pathname = usePathname()
    const [blitzUser] = useAtom(compoundUserAtom)
    const { isParticipant, contest, participantRole, loading } = useContest()
    const hasRedirected = useRef(false)
    const lastRoutingDecision = useRef<string>("")
    const redirectCooldown = useRef<number>(0)
    
    // Cooldown period to prevent rapid redirects (2 seconds)
    const REDIRECT_COOLDOWN = 2000

    useEffect(() => {
        // Don't redirect if still loading or user not authenticated
        if (loading || !blitzUser.auth.user || !blitzUser.auth.walletAddress) {
            return
        }

        // Don't redirect on admin pages
        if (pathname.startsWith('/admin')) {
            return
        }

        // Check cooldown to prevent rapid redirects
        const now = Date.now()
        if (now - redirectCooldown.current < REDIRECT_COOLDOWN) {
            return
        }

        // Reset redirect flag when path changes
        if (hasRedirected.current && pathname) {
            hasRedirected.current = false
        }

        // Determine where user should be
        const routingDecision = determineUserRoute(
            isParticipant,
            contest?.status || null,
            pathname
        )

        // Create a unique key for this routing decision to prevent oscillation
        const decisionKey = `${isParticipant}-${contest?.status}-${pathname}-${routingDecision.redirectPath}`
        
        // Prevent oscillating between the same decisions
        if (decisionKey === lastRoutingDecision.current) {
            return
        }

        // Debug logging for troubleshooting
        console.log(`Routing Debug: isParticipant=${isParticipant}, contest=${contest?.status}, path=${pathname}`)
        console.log(`Routing Decision: ${routingDecision.reason} -> ${routingDecision.redirectPath}`)
        
        // Temporarily disable automatic redirects to prevent loops
        if (routingDecision.shouldRedirect && !hasRedirected.current && false) {
            console.log(`Routing: ${routingDecision.reason} -> ${routingDecision.redirectPath}`)
            hasRedirected.current = true
            lastRoutingDecision.current = decisionKey
            redirectCooldown.current = now
            router.replace(routingDecision.redirectPath)
        }
    }, [
        loading,
        blitzUser.auth.user,
        blitzUser.auth.walletAddress,
        isParticipant,
        contest?.status,
        participantRole,
        pathname,
        router
    ])

    return {
        isParticipant,
        contest,
        participantRole,
        loading,
        userType: isParticipant ? 'creator' : 'spectator'
    }
}
