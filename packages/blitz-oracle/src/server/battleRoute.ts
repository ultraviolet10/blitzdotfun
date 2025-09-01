import { Hono } from "hono"
import { createContest, getAllContests, getContest } from "../handlers/admin/createContest"
import { createContestBodyValidation } from "../handlers/create/contestValidation"
import { createNewBattle } from "../handlers/create/createBattle"
import { createBattleBodyValidation } from "../handlers/create/validation"
import { checkContestDeposits } from "../services/depositMonitor"

const app = new Hono()

app.post(
    /**
     * This route is called when we detect that both users have deposited
     * tokens into the Blitz contract.
     */
    "/createNewBattle", //
    createBattleBodyValidation,
    async (c) => {
        const input = c.req.valid("json")
        const output = await createNewBattle(input)

        return c.json({ success: true, battleId: output.battleId })
    },
)

// Admin endpoints for contest management
app.post("/admin/contests", createContestBodyValidation, async (c) => {
    try {
        const input = c.req.valid("json")
        const contest = await createContest(input)
        return c.json({ success: true, contest })
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500)
    }
})

app.get("/admin/contests", async (c) => {
    try {
        const contests = await getAllContests()
        return c.json({ success: true, contests })
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500)
    }
})

app.get("/admin/contests/:contestId", async (c) => {
    try {
        const contestId = c.req.param("contestId")
        const contest = await getContest(contestId)

        if (!contest) {
            return c.json({ success: false, error: "Contest not found" }, 404)
        }

        return c.json({ success: true, contest })
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500)
    }
})

// Cron job endpoint for deposit monitoring
app.post("/cron/check-deposits", async (c) => {
    try {
        await checkContestDeposits()
        return c.json({ success: true, message: "Deposit check completed" })
    } catch (error) {
        console.error("Cron job error:", error)
        return c.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            500,
        )
    }
})

export default app

/**
 * post - /endOngoingBattle
 * needs to be called when a cron job understands that the 12 / 24 hour contest is up
 * calls `endContest` on Blitz.sol
 */

/**
 * get - /getCurrentBattleStats
 * needs to be called when a cron job understands that the 12 / 24 hour contest is up
 * calls `endContest` on Blitz.sol
 */

/**
 * get - /getCreatorDetails
 * needs to be called when a cron job understands that the 12 / 24 hour contest is up
 * calls `endContest` on Blitz.sol
 */

/**
 * get - /getCreatorContentCoinForBattle
 * needs to be called when a cron job understands that the 12 / 24 hour contest is up
 * calls `endContest` on Blitz.sol
 */
