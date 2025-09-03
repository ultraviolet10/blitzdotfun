import type { Contest, ContestStatus } from "../create/types"
import { getActiveContest, getAllContests } from "../admin/createContest"
import type { CloudflareBindings } from "../../types/env"

export interface ContestStatusResponse {
  contestId: string
  name: string
  status: ContestStatus
  participants: {
    one: {
      handle: string
      walletAddress: string
      depositStatus: {
        detected: boolean
        timestamp?: number
      }
      contentStatus: {
        detected: boolean
        verified: boolean
        timestamp?: number
        zoraPostUrl?: string
      }
    }
    two: {
      handle: string
      walletAddress: string
      depositStatus: {
        detected: boolean
        timestamp?: number
      }
      contentStatus: {
        detected: boolean
        verified: boolean
        timestamp?: number
        zoraPostUrl?: string
      }
    }
  }
  progress: {
    allDepositsReceived: boolean
    allContentSubmitted: boolean
    readyForBattle: boolean
  }
  deadlines: {
    deposit?: number
    content?: number
    battleEnd?: number
  }
  createdAt: number
  lastUpdated: number
}

export interface UserSpecificStatusResponse extends ContestStatusResponse {
  userRole: "participant_one" | "participant_two" | "spectator"
  userStatus?: {
    depositCompleted: boolean
    contentSubmitted: boolean
    canSubmitContent: boolean
    nextAction?: string
  }
}

/**
 * Get contest status optimized for frontend polling
 * Returns detailed status for seamless UI updates
 */
export async function getContestStatus(
  contestId?: string,
  env?: CloudflareBindings
): Promise<ContestStatusResponse | null> {
  try {
    // Get active contest if no specific contestId provided
    const contest = contestId 
      ? await getContestById(contestId, env)
      : await getActiveContest(env)

    if (!contest) {
      return null
    }

    return formatContestStatusResponse(contest)
  } catch (error) {
    console.error("Error getting contest status:", error)
    return null
  }
}

/**
 * Get contest status with user-specific information
 * Provides personalized status based on user's wallet address
 */
export async function getUserSpecificContestStatus(
  userWalletAddress: string,
  contestId?: string,
  env?: CloudflareBindings
): Promise<UserSpecificStatusResponse | null> {
  try {
    const baseStatus = await getContestStatus(contestId, env)
    if (!baseStatus) {
      return null
    }

    // Determine user role
    let userRole: "participant_one" | "participant_two" | "spectator" = "spectator"
    let userStatus: UserSpecificStatusResponse["userStatus"] = undefined

    const contest = contestId 
      ? await getContestById(contestId, env)
      : await getActiveContest(env)

    if (contest) {
      if (contest.participantOne.walletAddress.toLowerCase() === userWalletAddress.toLowerCase()) {
        userRole = "participant_one"
        userStatus = {
          depositCompleted: contest.deposits[contest.participantOne.walletAddress].detected,
          contentSubmitted: contest.contentStatus[contest.participantOne.walletAddress].detected,
          canSubmitContent: contest.status === "awaiting_content" && 
                           contest.deposits[contest.participantOne.walletAddress].detected,
          nextAction: getNextActionForUser(contest, "participant_one")
        }
      } else if (contest.participantTwo.walletAddress.toLowerCase() === userWalletAddress.toLowerCase()) {
        userRole = "participant_two"
        userStatus = {
          depositCompleted: contest.deposits[contest.participantTwo.walletAddress].detected,
          contentSubmitted: contest.contentStatus[contest.participantTwo.walletAddress].detected,
          canSubmitContent: contest.status === "awaiting_content" && 
                           contest.deposits[contest.participantTwo.walletAddress].detected,
          nextAction: getNextActionForUser(contest, "participant_two")
        }
      }
    }

    return {
      ...baseStatus,
      userRole,
      userStatus
    }
  } catch (error) {
    console.error("Error getting user-specific contest status:", error)
    return null
  }
}

/**
 * Get all contests with their current status
 * Useful for admin dashboard or contest history
 */
export async function getAllContestStatuses(
  env?: CloudflareBindings
): Promise<ContestStatusResponse[]> {
  try {
    const contests = await getAllContests(env || {} as CloudflareBindings)
    return contests.map(formatContestStatusResponse)
  } catch (error) {
    console.error("Error getting all contest statuses:", error)
    return []
  }
}

/**
 * Get lightweight status for polling - only essential information
 * Optimized for frequent polling with minimal data transfer
 */
export async function getLightweightContestStatus(
  contestId?: string,
  env?: CloudflareBindings
): Promise<{
  contestId: string
  status: ContestStatus
  allDepositsReceived: boolean
  allContentSubmitted: boolean
  lastUpdated: number
} | null> {
  try {
    const contest = contestId 
      ? await getContestById(contestId, env)
      : await getActiveContest(env)

    if (!contest) {
      return null
    }

    const allDepositsReceived = Object.values(contest.deposits).every(d => d.detected)
    const allContentSubmitted = Object.values(contest.contentStatus).every(c => c.detected)

    return {
      contestId: contest.contestId,
      status: contest.status,
      allDepositsReceived,
      allContentSubmitted,
      lastUpdated: Date.now()
    }
  } catch (error) {
    console.error("Error getting lightweight contest status:", error)
    return null
  }
}

// Helper functions

async function getContestById(contestId: string, env?: CloudflareBindings): Promise<Contest | null> {
  const contests = await getAllContests(env || {} as CloudflareBindings)
  return contests.find(c => c.contestId === contestId) || null
}

function formatContestStatusResponse(contest: Contest): ContestStatusResponse {
  const allDepositsReceived = Object.values(contest.deposits).every(d => d.detected)
  const allContentSubmitted = Object.values(contest.contentStatus).every(c => c.detected)

  return {
    contestId: contest.contestId,
    name: contest.name,
    status: contest.status,
    participants: {
      one: {
        handle: contest.participantOne.handle,
        walletAddress: contest.participantOne.walletAddress,
        depositStatus: {
          detected: contest.deposits[contest.participantOne.walletAddress].detected,
          timestamp: contest.deposits[contest.participantOne.walletAddress].timestamp
        },
        contentStatus: {
          detected: contest.contentStatus[contest.participantOne.walletAddress].detected,
          verified: contest.contentStatus[contest.participantOne.walletAddress].verified,
          timestamp: contest.contentStatus[contest.participantOne.walletAddress].timestamp,
          zoraPostUrl: contest.contentStatus[contest.participantOne.walletAddress].zoraPostUrl
        }
      },
      two: {
        handle: contest.participantTwo.handle,
        walletAddress: contest.participantTwo.walletAddress,
        depositStatus: {
          detected: contest.deposits[contest.participantTwo.walletAddress].detected,
          timestamp: contest.deposits[contest.participantTwo.walletAddress].timestamp
        },
        contentStatus: {
          detected: contest.contentStatus[contest.participantTwo.walletAddress].detected,
          verified: contest.contentStatus[contest.participantTwo.walletAddress].verified,
          timestamp: contest.contentStatus[contest.participantTwo.walletAddress].timestamp,
          zoraPostUrl: contest.contentStatus[contest.participantTwo.walletAddress].zoraPostUrl
        }
      }
    },
    progress: {
      allDepositsReceived,
      allContentSubmitted,
      readyForBattle: contest.status === "active_battle"
    },
    deadlines: {
      deposit: contest.depositDeadline,
      content: contest.contentDeadline,
      battleEnd: contest.battleEndTime
    },
    createdAt: contest.createdAt,
    lastUpdated: Date.now()
  }
}

function getNextActionForUser(contest: Contest, userRole: "participant_one" | "participant_two"): string {
  const participant = userRole === "participant_one" ? contest.participantOne : contest.participantTwo
  const userDeposit = contest.deposits[participant.walletAddress]
  const userContent = contest.contentStatus[participant.walletAddress]

  switch (contest.status) {
    case "awaiting_deposits":
      return userDeposit.detected ? "Wait for opponent to deposit" : "Make your deposit"
    
    case "awaiting_content":
      if (!userDeposit.detected) {
        return "Deposit required before content submission"
      }
      return userContent.detected ? "Wait for opponent to submit content" : "Submit your content"
    
    case "active_battle":
      return "Vote and engage with the battle"
    
    case "completed":
      return "Battle completed - view results"
    
    case "forfeited":
      return "Contest was forfeited"
    
    default:
      return "Check contest status"
  }
}
