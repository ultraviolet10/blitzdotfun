/**
 * ROUTING LOGIC
 *
 * Simple routing logic based on user type and contest status.
 * Uses basic contest status checking without complex deposit/content tracking.
 */

export interface RoutingDecision {
    shouldRedirect: boolean
    redirectPath: string
    reason: string
}

/**
 * Determine the correct route for a creator (contest participant)
 * Flow: welcome → success → post → contest → winner
 */
export function getCreatorRoute(
    contestStatus: string | null,
    currentPath: string
): RoutingDecision {
    // Handle root path - redirect creators to appropriate page
    if (currentPath === "/") {
        if (!contestStatus) {
            return {
                shouldRedirect: true,
                redirectPath: "/pre-battle",
                reason: "No contest, redirect to pre-battle"
            }
        }
        // Redirect to appropriate creator page based on status
        const targetPath = contestStatus === "AWAITING_DEPOSITS" ? "/welcome" :
                          contestStatus === "AWAITING_CONTENT" ? "/post" :
                          contestStatus === "ACTIVE_BATTLE" ? "/contest" :
                          "/winner"
        return {
            shouldRedirect: true,
            redirectPath: targetPath,
            reason: `Creator redirect from root to ${targetPath}`
        }
    }

    if (!contestStatus) {
        return { shouldRedirect: false, redirectPath: "", reason: "No contest" }
    }

    switch (contestStatus) {
        case "AWAITING_DEPOSITS":
            // Creator should start on welcome page
            if (currentPath !== "/welcome" && currentPath !== "/success") {
                return {
                    shouldRedirect: true,
                    redirectPath: "/welcome",
                    reason: "Creator needs to make deposit"
                }
            }
            break

        case "AWAITING_CONTENT":
            // After deposits, creators go through success → post flow
            if (currentPath === "/welcome") {
                return {
                    shouldRedirect: true,
                    redirectPath: "/success",
                    reason: "Deposits received, show success"
                }
            }
            if (currentPath !== "/success" && currentPath !== "/post") {
                return {
                    shouldRedirect: true,
                    redirectPath: "/post",
                    reason: "Ready to post content"
                }
            }
            break

        case "ACTIVE_BATTLE":
            // Battle is active, show contest
            if (currentPath !== "/contest") {
                return {
                    shouldRedirect: true,
                    redirectPath: "/contest",
                    reason: "Battle is active"
                }
            }
            break

        case "COMPLETED":
        case "FORFEITED":
            // Contest ended, show winner
            if (currentPath !== "/winner") {
                return {
                    shouldRedirect: true,
                    redirectPath: "/winner",
                    reason: "Contest ended"
                }
            }
            break
    }

    return { shouldRedirect: false, redirectPath: "", reason: "Current path is correct" }
}

/**
 * Determine the correct route for a regular user (spectator)
 * Flow: pre-battle → contest → winner
 */
export function getRegularUserRoute(
    contestStatus: string | null,
    currentPath: string
): RoutingDecision {
    // Handle root path - redirect spectators to pre-battle
    if (currentPath === "/") {
        return {
            shouldRedirect: true,
            redirectPath: "/pre-battle",
            reason: "Spectator redirect from root to pre-battle"
        }
    }

    if (!contestStatus) {
        if (currentPath !== "/pre-battle") {
            return {
                shouldRedirect: true,
                redirectPath: "/pre-battle",
                reason: "No active contest"
            }
        }
        return { shouldRedirect: false, redirectPath: "", reason: "No contest, on pre-battle" }
    }

    switch (contestStatus) {
        case "AWAITING_DEPOSITS":
        case "AWAITING_CONTENT":
            // Contest is preparing, show pre-battle
            if (currentPath !== "/pre-battle") {
                return {
                    shouldRedirect: true,
                    redirectPath: "/pre-battle",
                    reason: "Contest is preparing"
                }
            }
            break

        case "ACTIVE_BATTLE":
            // Battle is active, show contest
            if (currentPath !== "/contest") {
                return {
                    shouldRedirect: true,
                    redirectPath: "/contest",
                    reason: "Battle is active"
                }
            }
            break

        case "COMPLETED":
        case "FORFEITED":
            // Contest ended, show winner
            if (currentPath !== "/winner") {
                return {
                    shouldRedirect: true,
                    redirectPath: "/winner",
                    reason: "Contest ended"
                }
            }
            break
    }

    return { shouldRedirect: false, redirectPath: "", reason: "Current path is correct" }
}

/**
 * Main routing function that determines where a user should be
 */
export function determineUserRoute(
    isParticipant: boolean,
    contestStatus: string | null,
    currentPath: string
): RoutingDecision {
    // If user is a creator/participant
    if (isParticipant) {
        return getCreatorRoute(contestStatus, currentPath)
    }

    // If user is a regular user/spectator
    return getRegularUserRoute(contestStatus, currentPath)
}
