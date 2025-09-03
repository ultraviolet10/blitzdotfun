import { deployment } from "@blitzdotfun/blitz-contracts/local"
import { parseAbiItem } from "viem"
import { contests } from "../handlers/admin/createContest"
import type { Contest } from "../handlers/create/types"
import { blitzPublicClient } from "./clients"
import { createFirebaseService } from "./firebase"
import type { CloudflareBindings } from "../types/env"

const TOKENS_DEPOSITED_EVENT = parseAbiItem(
    "event TokensDeposited(address indexed creator, address indexed coinAddress, uint256 amount)",
)

export async function checkContestDeposits(env?: CloudflareBindings) {
    console.log("Checking contest deposits...")

    const activeContests = Array.from(contests.values()).filter(
        (contest) => contest.status === "awaiting_deposits",
    )

    if (activeContests.length === 0) {
        console.log("No active contests to monitor")
        return
    }

    console.log(`Monitoring ${activeContests.length} active contests`)

    for (const contest of activeContests) {
        await checkSingleContestDeposits(contest, env)
    }
}

async function checkSingleContestDeposits(contest: Contest, env?: CloudflareBindings) {
    try {
        // Check deposits for both participants
        const participantOneDeposited = await checkParticipantDeposit(
            contest.participantOne.walletAddress,
            contest.contractAddress,
            contest.createdAt,
        )

        const participantTwoDeposited = await checkParticipantDeposit(
            contest.participantTwo.walletAddress,
            contest.contractAddress,
            contest.createdAt,
        )

        // Update contest state if deposits detected
        let statusChanged = false

        if (participantOneDeposited.detected && !contest.deposits[contest.participantOne.walletAddress].detected) {
            contest.deposits[contest.participantOne.walletAddress] = {
                detected: true,
                timestamp: Date.now(),
                txHash: participantOneDeposited.txHash,
                blockNumber: participantOneDeposited.blockNumber,
            }
            statusChanged = true
            console.log(`✅ Deposit detected for ${contest.participantOne.handle} in contest ${contest.contestId}`)
        }

        if (participantTwoDeposited.detected && !contest.deposits[contest.participantTwo.walletAddress].detected) {
            contest.deposits[contest.participantTwo.walletAddress] = {
                detected: true,
                timestamp: Date.now(),
                txHash: participantTwoDeposited.txHash,
                blockNumber: participantTwoDeposited.blockNumber,
            }
            statusChanged = true
            console.log(`✅ Deposit detected for ${contest.participantTwo.handle} in contest ${contest.contestId}`)
        }

        // Check if both participants have deposited
        const allDeposited = Object.values(contest.deposits).every((deposit) => deposit.detected)

        if (allDeposited && contest.status === "awaiting_deposits") {
            contest.status = "awaiting_content"
            contest.contentDeadline = Date.now() + 5 * 60 * 1000 // 5 minutes from now
            statusChanged = true
            console.log(`🚀 Contest ${contest.contestId} moved to awaiting_content phase - both deposits detected!`)
        }

        if (statusChanged) {
            // Update the contest in storage
            contests.set(contest.contestId, contest)
            
            // Try to persist changes to Firebase
            if (env) {
                try {
                    const firebaseService = createFirebaseService(env)
                    await firebaseService.updateData(`contests/${contest.contestId}`, {
                        status: contest.status,
                        deposits: contest.deposits,
                        contentDeadline: contest.contentDeadline
                    })
                    console.log(`✅ Contest ${contest.contestId} status updated in Firebase`)
                } catch (firebaseError) {
                    console.warn(`Failed to update contest ${contest.contestId} in Firebase:`, firebaseError)
                }
            }
        }
    } catch (error) {
        console.error(`Error checking deposits for contest ${contest.contestId}:`, error)
    }
}

async function checkParticipantDeposit(
    creatorAddress: string,
    _contractAddress: string,
    contestCreatedAt: number,
): Promise<{ detected: boolean; txHash?: string; blockNumber?: bigint }> {
    try {
        // Get TokensDeposited events from the time the contest was created
        const fromBlock = await getBlockFromTimestamp(contestCreatedAt)

        const logs = await blitzPublicClient.getLogs({
            address: deployment.Blitz,
            event: TOKENS_DEPOSITED_EVENT,
            fromBlock: fromBlock,
            toBlock: "latest",
            args: {
                creator: creatorAddress as `0x${string}`,
            },
        })

        if (logs.length > 0) {
            const latestLog = logs[logs.length - 1]
            return {
                detected: true,
                txHash: latestLog.transactionHash,
                blockNumber: latestLog.blockNumber,
            }
        }

        return { detected: false }
    } catch (error) {
        console.error(`Error checking deposit for ${creatorAddress}:`, error)
        return { detected: false }
    }
}

async function getBlockFromTimestamp(timestamp: number): Promise<bigint> {
    try {
        // Simple approximation - Base has ~2 second block times
        const currentBlock = await blitzPublicClient.getBlockNumber()
        const currentTime = Date.now()
        const timeDiff = (currentTime - timestamp) / 1000 // seconds
        const blockDiff = BigInt(Math.floor(timeDiff / 2)) // ~2 sec per block

        return currentBlock - blockDiff
    } catch (error) {
        console.error("Error calculating block from timestamp:", error)
        return BigInt(0)
    }
}
