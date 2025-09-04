import { Hono } from "hono";
import {
  createContest,
  getAllContests,
  getContest,
  getActiveContest,
  completeContest,
  forfeitContest,
} from "../handlers/admin/createContest";
import { createContestBodyValidation } from "../handlers/create/contestValidation";
import { createNewBattle } from "../handlers/create/createBattle";
import { createBattleBodyValidation } from "../handlers/create/contestValidation";
import { checkContestDeposits } from "../services/depositMonitor";
import { createFirebaseService } from "../services/firebase";
import type { CloudflareBindings } from "../types/env";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post(
  /**
   * This route is called when we detect that both users have deposited
   * tokens into the Blitz contract.
   */
  "/createNewBattle", //
  createBattleBodyValidation,
  async (c) => {
    const input = c.req.valid("json");
    const output = await createNewBattle(input, c.env);

    return c.json({ success: true, battleId: output.battleId });
  }
);

// Admin endpoints for contest management
app.post("/admin/contests", createContestBodyValidation, async (c) => {
  try {
    const input = c.req.valid("json");
    const contest = await createContest(input, c.env);

    // Try to store contest data in Firebase, but don't fail if Firebase isn't configured
    try {
      const firebaseService = createFirebaseService(c.env);
      await firebaseService.writeData(`contests/${contest.contestId}`, contest);
      console.log(
        `Contest data stored in Firebase at path: contests/${contest.contestId}`
      );
    } catch (firebaseError) {
      // Log the error but continue with the request
      console.warn("Failed to store contest in Firebase:", firebaseError);
      console.log(
        "Contest will only be stored in memory. Set up Firebase for persistence."
      );
    }

    return c.json({ success: true, contest });
  } catch (error) {
    console.error("Error creating contest:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.get("/admin/contests", async (c) => {
  try {
    // Fetch contests only when this endpoint is called
    const contests = await getAllContests(c.env);
    return c.json({ success: true, contests });
  } catch (error) {
    console.error("Error in /admin/contests endpoint:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.get("/admin/contests/:contestId", async (c) => {
  try {
    const contestId = c.req.param("contestId");
    const contest = await getContest(contestId, c.env);

    if (!contest) {
      return c.json({ success: false, error: "Contest not found" }, 404);
    }

    return c.json({ success: true, contest });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Get the currently active contest
app.get("/admin/contests/active", async (c) => {
  try {
    const activeContest = await getActiveContest(c.env);
    
    if (!activeContest) {
      return c.json({ success: true, activeContest: null, message: "No active contest found" });
    }
    
    return c.json({ success: true, activeContest });
  } catch (error) {
    console.error("Error getting active contest:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Complete a contest (mark as finished)
app.patch("/admin/contests/:contestId/complete", async (c) => {
  try {
    const contestId = c.req.param("contestId");
    const success = await completeContest(contestId, c.env);
    
    if (!success) {
      return c.json({ success: false, error: "Failed to complete contest" }, 500);
    }
    
    return c.json({ success: true, message: `Contest ${contestId} marked as completed` });
  } catch (error) {
    console.error("Error completing contest:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Forfeit a contest (mark as forfeited)
app.patch("/admin/contests/:contestId/forfeit", async (c) => {
  try {
    const contestId = c.req.param("contestId");
    const success = await forfeitContest(contestId, c.env);
    
    if (!success) {
      return c.json({ success: false, error: "Failed to forfeit contest" }, 500);
    }
    
    return c.json({ success: true, message: `Contest ${contestId} marked as forfeited` });
  } catch (error) {
    console.error("Error forfeiting contest:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Cron job endpoint for deposit monitoring
app.post("/cron/check-deposits", async (c) => {
  try {
    const startTime = Date.now();
    console.log("🔍 Starting deposit monitoring cron job...");
    
    await checkContestDeposits(c.env);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Deposit monitoring completed in ${duration}ms`);
    
    return c.json({ 
      success: true, 
      message: "Deposit monitoring completed",
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Deposit monitoring cron job error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      500
    );
  }
});

// Endpoint for mini-app to check contest status updates
app.get("/contest/status", async (c) => {
  try {
    const activeContest = await getActiveContest(c.env);
    
    if (!activeContest) {
      return c.json({ 
        success: true, 
        status: "no_active_contest",
        message: "No active contest found" 
      });
    }
    
    // Return contest status with deposit information for mini-app
    const response = {
      success: true,
      contest: {
        contestId: activeContest.contestId,
        name: activeContest.name,
        status: activeContest.status,
        participantOne: {
          handle: activeContest.participantOne.handle,
          walletAddress: activeContest.participantOne.walletAddress,
          depositDetected: activeContest.deposits[activeContest.participantOne.walletAddress]?.detected || false,
          depositTimestamp: activeContest.deposits[activeContest.participantOne.walletAddress]?.timestamp
        },
        participantTwo: {
          handle: activeContest.participantTwo.handle,
          walletAddress: activeContest.participantTwo.walletAddress,
          depositDetected: activeContest.deposits[activeContest.participantTwo.walletAddress]?.detected || false,
          depositTimestamp: activeContest.deposits[activeContest.participantTwo.walletAddress]?.timestamp
        },
        allDepositsReceived: Object.values(activeContest.deposits).every(deposit => deposit.detected),
        contentDeadline: activeContest.contentDeadline,
        battleEndTime: activeContest.battleEndTime
      }
    };
    
    return c.json(response);
  } catch (error) {
    console.error("Error getting contest status:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
