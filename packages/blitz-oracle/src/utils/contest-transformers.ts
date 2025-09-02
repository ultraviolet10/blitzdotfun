import type { Address } from "viem"
import type { Contest } from "../handlers/create/types"
import type { ContestIndexData, FirebaseContest } from "../types/contest-firebase"
import type {
    BattleScreenData,
    ContestParticipantData,
    OngoingContestData,
    WelcomeScreenData,
} from "../types/mini-app-api"

/**
 * Transform legacy Contest type to Firebase-optimized structure
 */
export function contestToFirebase(contest: Contest): FirebaseContest {
    const participantAddresses = [contest.participantOne.walletAddress, contest.participantTwo.walletAddress]

    return {
        basicInfo: {
            contestId: contest.contestId,
            name: contest.name,
            status: contest.status,
            createdAt: contest.createdAt,
            contractAddress: contest.contractAddress,
            depositDeadline: contest.depositDeadline,
            contentDeadline: contest.contentDeadline,
            battleEndTime: contest.battleEndTime,
            tokenConversionRate: 1000, // Default: 1000 tokens = $500
            prizeAmount: "$500",
        },

        participants: {
            [contest.participantOne.walletAddress]: {
                handle: contest.participantOne.handle,
                walletAddress: contest.participantOne.walletAddress,
                zoraProfile: contest.participantOne.zoraProfile,
                role: "creator", // Assume participants are creators by default

                deposits: contest.deposits[contest.participantOne.walletAddress] || { detected: false },

                contentPosts: contest.contentPosts[contest.participantOne.walletAddress] || { detected: false },

                battle: {
                    canPurchase: false, // Creators can't purchase their own content
                    votesReceived: contest.metrics?.participantOneVotes || 0,
                },
            },

            [contest.participantTwo.walletAddress]: {
                handle: contest.participantTwo.handle,
                walletAddress: contest.participantTwo.walletAddress,
                zoraProfile: contest.participantTwo.zoraProfile,
                role: "creator",

                deposits: contest.deposits[contest.participantTwo.walletAddress] || { detected: false },

                contentPosts: contest.contentPosts[contest.participantTwo.walletAddress] || { detected: false },

                battle: {
                    canPurchase: false, // Creators can't purchase their own content
                    votesReceived: contest.metrics?.participantTwoVotes || 0,
                },
            },
        },

        battle: contest.battleId
            ? {
                  battleId: contest.battleId,
                  startTime: contest.createdAt, // Use creation time as default
                  endTime: contest.battleEndTime || 0,
                  isActive: contest.status === "active_battle",
                  totalVolume: 0, // Initialize
                  totalVotes: (contest.metrics?.participantOneVotes || 0) + (contest.metrics?.participantTwoVotes || 0),
                  winner: undefined,
              }
            : undefined,

        metrics: contest.metrics
            ? {
                  ...contest.metrics,
                  coin1MarketCap: 0,
                  coin2MarketCap: 0,
                  coin1Volume: 0,
                  coin2Volume: 0,
                  coin1Price: 0,
                  coin2Price: 0,
                  depositsCompleted: Object.values(contest.deposits).filter((d) => d.detected).length,
                  contentSubmitted: Object.values(contest.contentPosts).filter((c) => c.detected).length,
                  readyForBattle: contest.status === "active_battle" || contest.status === "completed",
              }
            : {
                  participantOneVotes: 0,
                  participantTwoVotes: 0,
                  lastUpdated: Date.now(),
                  coin1MarketCap: 0,
                  coin2MarketCap: 0,
                  coin1Volume: 0,
                  coin2Volume: 0,
                  coin1Price: 0,
                  coin2Price: 0,
                  depositsCompleted: Object.values(contest.deposits).filter((d) => d.detected).length,
                  contentSubmitted: Object.values(contest.contentPosts).filter((c) => c.detected).length,
                  readyForBattle: false,
              },

        callbacks: {
            depositCallbacks: participantAddresses,
            contentCallbacks: participantAddresses,
            battleStartCallbacks: participantAddresses,
        },
    }
}

/**
 * Transform Firebase contest back to legacy Contest type
 */
export function firebaseToContest(firebaseContest: FirebaseContest): Contest {
    const participantAddresses = Object.keys(firebaseContest.participants)
    const [addr1, addr2] = participantAddresses

    if (!addr1 || !addr2) {
        throw new Error("Contest must have exactly 2 participants")
    }

    const participant1 = firebaseContest.participants[addr1]
    const participant2 = firebaseContest.participants[addr2]

    return {
        contestId: firebaseContest.basicInfo.contestId,
        name: firebaseContest.basicInfo.name,
        status: firebaseContest.basicInfo.status,
        createdAt: firebaseContest.basicInfo.createdAt,
        contractAddress: firebaseContest.basicInfo.contractAddress as Address,
        depositDeadline: firebaseContest.basicInfo.depositDeadline,
        contentDeadline: firebaseContest.basicInfo.contentDeadline,
        battleEndTime: firebaseContest.basicInfo.battleEndTime,

        participantOne: {
            handle: participant1.handle,
            walletAddress: participant1.walletAddress as Address,
            zoraProfile: participant1.zoraProfile,
        },

        participantTwo: {
            handle: participant2.handle,
            walletAddress: participant2.walletAddress as Address,
            zoraProfile: participant2.zoraProfile,
        },

        deposits: {
            [addr1]: participant1.deposits,
            [addr2]: participant2.deposits,
        },

        contentPosts: {
            [addr1]: participant1.contentPosts,
            [addr2]: participant2.contentPosts,
        },

        battleId: firebaseContest.battle?.battleId,
        metrics: firebaseContest.metrics
            ? {
                  participantOneVotes: participant1.battle.votesReceived,
                  participantTwoVotes: participant2.battle.votesReceived,
                  lastUpdated: firebaseContest.metrics.lastUpdated,
              }
            : undefined,
    }
}

/**
 * Transform Firebase contest to mini-app ongoing contest data
 */
export function firebaseToOngoingContest(firebaseContest: FirebaseContest, userWallet: Address): OngoingContestData {
    const participants = Object.values(firebaseContest.participants)
    const userParticipant = firebaseContest.participants[userWallet]

    return {
        contestId: firebaseContest.basicInfo.contestId,
        name: firebaseContest.basicInfo.name,
        status: firebaseContest.basicInfo.status,

        participants: participants.map((p) => transformParticipantData(p)),

        userParticipant: userParticipant ? transformParticipantData(userParticipant) : undefined,
        isUserCreator: userParticipant?.role === "creator" || false,
        isUserParticipant: !!userParticipant,

        progress: {
            depositsCompleted: firebaseContest.metrics?.depositsCompleted || 0,
            totalParticipants: participants.length,
            contentSubmitted: firebaseContest.metrics?.contentSubmitted || 0,
            readyForBattle: firebaseContest.metrics?.readyForBattle || false,
        },

        depositRequirement: {
            tokenAmount: firebaseContest.basicInfo.tokenConversionRate || 1000,
            prizeAmount: firebaseContest.basicInfo.prizeAmount || "$500",
            contractAddress: firebaseContest.basicInfo.contractAddress as Address,
        },

        battle: firebaseContest.battle
            ? {
                  battleId: firebaseContest.battle.battleId,
                  isActive: firebaseContest.battle.isActive,
                  startTime: firebaseContest.battle.startTime,
                  endTime: firebaseContest.battle.endTime,
                  timeRemaining: Math.max(0, firebaseContest.battle.endTime - Date.now()),
                  creatorOneCoin: firebaseContest.battle.creatorOneCoin,
                  creatorTwoCoin: firebaseContest.battle.creatorTwoCoin,
                  totalVolume: firebaseContest.battle.totalVolume,
                  totalVotes: firebaseContest.battle.totalVotes,
                  userCanPurchase: userParticipant?.battle.canPurchase || false,
                  purchaseRedirectUrl: userParticipant?.battle.purchaseRedirectUrl,
              }
            : undefined,

        nextAction: determineNextAction(firebaseContest, userWallet),
    }
}

/**
 * Transform Firebase participant data to mini-app format
 */
function transformParticipantData(participant: FirebaseContest["participants"][string]): ContestParticipantData {
    return {
        handle: participant.handle,
        walletAddress: participant.walletAddress as Address,
        zoraProfile: participant.zoraProfile,
        role: participant.role,

        hasDeposited: participant.deposits.detected,
        hasSubmittedContent: participant.contentPosts.detected,

        depositInfo: participant.deposits.detected
            ? {
                  txHash: participant.deposits.txHash || "",
                  timestamp: participant.deposits.timestamp || 0,
                  amountDeposited: participant.deposits.amountDeposited || "",
              }
            : undefined,

        contentInfo: participant.contentPosts.detected
            ? {
                  zoraPostUrl: participant.contentPosts.zoraPostUrl || "",
                  contentCoinAddress: participant.contentPosts.contentCoinAddress,
                  timestamp: participant.contentPosts.timestamp || 0,
                  hasBlitzTag: participant.contentPosts.hasBlitzTag || false,
              }
            : undefined,

        battleInfo: {
            votesReceived: participant.battle.votesReceived,
            canPurchaseOwn: participant.battle.canPurchase,
            purchaseUrl: participant.battle.purchaseRedirectUrl,
        },
    }
}

/**
 * Determine the next action for a user based on contest state
 */
function determineNextAction(firebaseContest: FirebaseContest, userWallet: Address): OngoingContestData["nextAction"] {
    const userParticipant = firebaseContest.participants[userWallet]
    const status = firebaseContest.basicInfo.status

    if (!userParticipant) {
        return { type: "wait", message: "You are not a participant in this contest" }
    }

    switch (status) {
        case "created":
        case "awaiting_deposits":
            if (!userParticipant.deposits.detected) {
                return {
                    type: "deposit",
                    message: `Deposit ${firebaseContest.basicInfo.tokenConversionRate || 1000} tokens to join`,
                    deadline: firebaseContest.basicInfo.depositDeadline,
                }
            }
            return { type: "wait", message: "Waiting for other participants to deposit" }

        case "awaiting_content":
            if (!userParticipant.contentPosts.detected) {
                return {
                    type: "content",
                    message: "Post your content on Zora with #blitzdotfun tag",
                    deadline: firebaseContest.basicInfo.contentDeadline,
                }
            }
            return { type: "wait", message: "Waiting for other participants to submit content" }

        case "active_battle":
            return {
                type: "battle",
                message: "Contest is live! Vote for your favorite",
                deadline: firebaseContest.basicInfo.battleEndTime,
            }

        case "completed":
            return { type: "completed", message: "Contest has ended" }

        case "forfeited":
            return { type: "completed", message: "Contest was forfeited" }

        default:
            return { type: "wait", message: "Unknown contest state" }
    }
}

/**
 * Create contest index data for Firebase indexing
 */
export function createContestIndex(contest: FirebaseContest): ContestIndexData {
    return {
        createdAt: contest.basicInfo.createdAt,
        status: contest.basicInfo.status,
        name: contest.basicInfo.name,
        participants: Object.keys(contest.participants),
    }
}

/**
 * Transform Firebase contest for welcome screen
 */
export function firebaseToWelcomeScreen(firebaseContest: FirebaseContest, userWallet: Address): WelcomeScreenData {
    const participants = Object.values(firebaseContest.participants)

    return {
        contestId: firebaseContest.basicInfo.contestId,
        competitorData: {
            participants: participants.map((p) => transformParticipantData(p)),
            userIsCompetitor: !!firebaseContest.participants[userWallet],
            userCompetitor: firebaseContest.participants[userWallet]
                ? transformParticipantData(firebaseContest.participants[userWallet])
                : undefined,
        },
        depositRequirement: {
            tokenAmount: firebaseContest.basicInfo.tokenConversionRate || 1000,
            prizeAmount: firebaseContest.basicInfo.prizeAmount || "$500",
            contractAddress: firebaseContest.basicInfo.contractAddress as Address,
        },
    }
}

/**
 * Transform Firebase contest for battle screen
 */
export function firebaseToBattleScreen(firebaseContest: FirebaseContest, userWallet: Address): BattleScreenData {
    const participants = Object.values(firebaseContest.participants)
    const userParticipant = firebaseContest.participants[userWallet]

    return {
        contestId: firebaseContest.basicInfo.contestId,
        battleId: firebaseContest.battle?.battleId || "",

        participants: participants.map((p) => ({
            handle: p.handle,
            walletAddress: p.walletAddress as Address,
            contentCoinAddress: p.contentPosts.contentCoinAddress,
            votesReceived: p.battle.votesReceived,
            canPurchase: p.walletAddress !== userWallet, // Can't purchase own content
            purchaseUrl: p.walletAddress !== userWallet ? p.battle.purchaseRedirectUrl : undefined,
        })),

        battle: {
            isActive: firebaseContest.battle?.isActive || false,
            timeRemaining: firebaseContest.battle ? Math.max(0, firebaseContest.battle.endTime - Date.now()) : 0,
            totalVolume: firebaseContest.battle?.totalVolume || 0,
            totalVotes: firebaseContest.battle?.totalVotes || 0,
        },

        userRole: userParticipant?.role || "spectator",
        userCanParticipate: !!userParticipant && firebaseContest.basicInfo.status === "active_battle",
    }
}
