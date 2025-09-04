import type { Contest, ContentStatus } from "../handlers/create/types"
import { contests } from "../handlers/admin/createContest"
import { createFirebaseService } from "./firebase"
import type { CloudflareBindings } from "../types/env"

export async function checkContestContent(env?: CloudflareBindings) {
    console.log("Checking contest content submissions...")

    const activeContests = Array.from(contests.values()).filter(
        (contest) => contest.status === "awaiting_content",
    )

    if (activeContests.length === 0) {
        console.log("No contests awaiting content to monitor")
        return
    }

    console.log(`Monitoring ${activeContests.length} contests awaiting content`)

    for (const contest of activeContests) {
        await checkSingleContestContent(contest, env)
    }
}

async function checkSingleContestContent(contest: Contest, env?: CloudflareBindings) {
    try {
        // Check content submissions for both participants
        const participantOneContent = await checkParticipantContent(
            contest.participantOne.walletAddress,
            contest.participantOne.zoraProfile || contest.participantOne.handle,
            contest.contentDeadline || contest.createdAt + 5 * 60 * 1000
        )

        const participantTwoContent = await checkParticipantContent(
            contest.participantTwo.walletAddress,
            contest.participantTwo.zoraProfile || contest.participantTwo.handle,
            contest.contentDeadline || contest.createdAt + 5 * 60 * 1000
        )

        // Update contest state if content detected
        let statusChanged = false

        if (participantOneContent.detected && !contest.contentStatus[contest.participantOne.walletAddress].detected) {
            contest.contentStatus[contest.participantOne.walletAddress] = {
                detected: true,
                verified: participantOneContent.verified,
                zoraPostUrl: participantOneContent.zoraPostUrl,
                timestamp: Date.now(),
                contentHash: participantOneContent.contentHash,
            }
            
            
            statusChanged = true
            console.log(`✅ Content detected for ${contest.participantOne.handle} in contest ${contest.contestId}`)
        }

        if (participantTwoContent.detected && !contest.contentStatus[contest.participantTwo.walletAddress].detected) {
            contest.contentStatus[contest.participantTwo.walletAddress] = {
                detected: true,
                verified: participantTwoContent.verified,
                zoraPostUrl: participantTwoContent.zoraPostUrl,
                timestamp: Date.now(),
                contentHash: participantTwoContent.contentHash,
            }
            
            
            statusChanged = true
            console.log(`✅ Content detected for ${contest.participantTwo.handle} in contest ${contest.contestId}`)
        }

        // Check if both participants have submitted content
        const allContentSubmitted = Object.values(contest.contentStatus).every((content) => content.detected)

        if (allContentSubmitted && contest.status === "awaiting_content") {
            contest.status = "active_battle"
            contest.battleEndTime = Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
            statusChanged = true
            console.log(`🚀 Contest ${contest.contestId} moved to active_battle phase - both content submissions detected!`)
        }

        // Check for content deadline expiry
        const contentDeadline = contest.contentDeadline || contest.createdAt + 5 * 60 * 1000
        if (Date.now() > contentDeadline && contest.status === "awaiting_content") {
            // Check if at least one participant submitted content
            const anyContentSubmitted = Object.values(contest.contentStatus).some((content) => content.detected)
            
            if (anyContentSubmitted) {
                // Move to active battle even with partial content
                contest.status = "active_battle"
                contest.battleEndTime = Date.now() + 24 * 60 * 60 * 1000
                statusChanged = true
                console.log(`⏰ Contest ${contest.contestId} moved to active_battle due to deadline - partial content detected`)
            } else {
                // No content submitted, forfeit the contest
                contest.status = "forfeited"
                statusChanged = true
                console.log(`❌ Contest ${contest.contestId} forfeited - no content submitted by deadline`)
            }
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
                        contentStatus: contest.contentStatus,
                        battleEndTime: contest.battleEndTime
                    })
                    console.log(`✅ Contest ${contest.contestId} content status updated in Firebase`)
                } catch (firebaseError) {
                    console.warn(`Failed to update contest ${contest.contestId} in Firebase:`, firebaseError)
                }
            }
        }
    } catch (error) {
        console.error(`Error checking content for contest ${contest.contestId}:`, error)
    }
}

async function checkParticipantContent(
    creatorAddress: string,
    zoraProfile: string,
    contentDeadline: number
): Promise<{
    detected: boolean;
    verified: boolean;
    zoraPostUrl?: string;
    contentHash?: string;
}> {
    try {
        // This is a placeholder for actual Zora API integration
        // In a real implementation, you would:
        // 1. Query Zora API for recent posts by the creator
        // 2. Check if posts were made after the contest content deadline started
        // 3. Verify the content meets contest requirements
        // 4. Return the post URL and verification status

        // For now, return a mock response
        // TODO: Implement actual Zora API integration
        console.log(`Checking content for creator ${creatorAddress} (${zoraProfile})`)
        
        // Mock implementation - replace with actual Zora API calls
        const mockContentDetected = Math.random() > 0.7 // 30% chance of content being detected
        
        if (mockContentDetected) {
            return {
                detected: true,
                verified: true,
                zoraPostUrl: `https://zora.co/${zoraProfile}/post/mock-${Date.now()}`,
                contentHash: `mock-hash-${creatorAddress.slice(-8)}`,
            }
        }

        return {
            detected: false,
            verified: false,
        }
    } catch (error) {
        console.error(`Error checking content for ${creatorAddress}:`, error)
        return {
            detected: false,
            verified: false,
        }
    }
}
