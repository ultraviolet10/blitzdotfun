import { Hono } from "hono"
import { createContest, getAllContests, getContest } from "../handlers/admin/createContest"
import { createContestBodyValidation } from "../handlers/create/contestValidation"
import { createNewBattle } from "../handlers/create/createBattle"
import { createBattleBodyValidation } from "../handlers/create/validation"
import { checkContestDeposits } from "../services/depositMonitor"
import { createFirebaseClient } from "../services/firebase-client"
import { testFirebaseConnection } from "../services/firebase-test"
import type { CloudflareBindings } from "../types/env"

const app = new Hono<{ Bindings: CloudflareBindings }>()

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

// Test endpoint for Firebase configuration
app.get("/test-firebase", async (c) => {
    try {
        await testFirebaseConnection(c.env)
        return c.json({ success: true, message: "Firebase configuration is valid" })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            500,
        )
    }
})

// Test endpoint for Firebase CRUD operations
app.get("/test-firebase-crud", async (c) => {
    try {
        const firebaseClient = createFirebaseClient(c.env)

        // Test data
        const testData = {
            message: "Hello Firebase!",
            timestamp: Date.now(),
            testId: Math.random().toString(36).substring(7),
        }

        // Test write
        console.log("Testing Firebase write...")
        await firebaseClient.writeData("test/crud", testData)

        // Test read
        console.log("Testing Firebase read...")
        const readResult = await firebaseClient.readData("test/crud")

        // Test update
        console.log("Testing Firebase update...")
        await firebaseClient.updateData("test/crud", { updated: true, updateTime: Date.now() })

        // Test read updated data
        const updatedResult = await firebaseClient.readData("test/crud")

        // Clean up - delete test data
        console.log("Cleaning up test data...")
        await firebaseClient.deleteData("test/crud")

        return c.json({
            success: true,
            message: "Firebase CRUD operations completed successfully",
            testResults: {
                originalData: readResult,
                updatedData: updatedResult,
            },
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            500,
        )
    }
})

// Individual Firebase operation test endpoints
app.post("/test/firebase/write", async (c) => {
    try {
        const firebaseClient = createFirebaseClient(c.env)
        const data = await c.req.json()
        const result = await firebaseClient.writeData("test/manual", data)
        return c.json({ success: true, result })
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500)
    }
})

app.get("/test/firebase/read/:path", async (c) => {
    try {
        const firebaseClient = createFirebaseClient(c.env)
        const path = c.req.param("path")
        const result = await firebaseClient.readData(`test/${path}`)
        return c.json({ success: true, data: result })
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500)
    }
})

app.patch("/test/firebase/update/:path", async (c) => {
    try {
        const firebaseClient = createFirebaseClient(c.env)
        const path = c.req.param("path")
        const data = await c.req.json()
        const result = await firebaseClient.updateData(`test/${path}`, data)
        return c.json({ success: true, result })
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500)
    }
})

app.delete("/test/firebase/delete/:path", async (c) => {
    try {
        const firebaseClient = createFirebaseClient(c.env)
        const path = c.req.param("path")
        const result = await firebaseClient.deleteData(`test/${path}`)
        return c.json({ success: true, result })
    } catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500)
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
