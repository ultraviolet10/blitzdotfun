import { Hono } from "hono";
import {
  createContest,
  getAllContests,
  getContest,
} from "../handlers/admin/createContest";
import { createContestBodyValidation } from "../handlers/create/contestValidation";
import { createNewBattle } from "../handlers/create/createBattle";
import { createBattleBodyValidation } from "../handlers/create/validation";
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
    const output = await createNewBattle(input);

    return c.json({ success: true, battleId: output.battleId });
  }
);

// Admin endpoints for contest management
app.post("/admin/contests", createContestBodyValidation, async (c) => {
  try {
    const input = c.req.valid("json");
    const contest = await createContest(input);

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

// Cron job endpoint for deposit monitoring
app.post("/cron/check-deposits", async (c) => {
  try {
    await checkContestDeposits();
    return c.json({ success: true, message: "Deposit check completed" });
  } catch (error) {
    console.error("Cron job error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Test endpoint for Firebase configuration
app.get("/test-firebase", async (c) => {
  try {
    const firebaseService = createFirebaseService(c.env);
    const isConnected = await firebaseService.testConnection();

    if (isConnected) {
      return c.json({
        success: true,
        message: "Firebase configuration is valid and connected",
      });
    } else {
      return c.json(
        {
          success: false,
          error: "Firebase connection test failed",
        },
        500
      );
    }
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

// Test endpoint for Firebase CRUD operations
app.get("/test-firebase-crud", async (c) => {
  try {
    const firebaseService = createFirebaseService(c.env);

    // Test data
    const testData = {
      message: "Hello Firebase!",
      timestamp: Date.now(),
      testId: Math.random().toString(36).substring(7),
    };

    // Test write
    console.log("Testing Firebase write...");
    await firebaseService.writeData("test/crud", testData);

    // Test read
    console.log("Testing Firebase read...");
    const readResult = await firebaseService.readData("test/crud");

    // Test update
    console.log("Testing Firebase update...");
    await firebaseService.updateData("test/crud", {
      updated: true,
      updateTime: Date.now(),
    });

    // Test read updated data
    const updatedResult = await firebaseService.readData("test/crud");

    // Clean up - delete test data
    console.log("Cleaning up test data...");
    await firebaseService.deleteData("test/crud");

    return c.json({
      success: true,
      message: "Firebase CRUD operations completed successfully",
      testResults: {
        originalData: readResult,
        updatedData: updatedResult,
      },
    });
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

// Individual Firebase operation test endpoints
app.post("/test/firebase/write", async (c) => {
  try {
    const firebaseService = createFirebaseService(c.env);
    const data = await c.req.json();
    await firebaseService.writeData("test/manual", data);
    return c.json({ success: true, message: "Data written successfully" });
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

app.get("/test/firebase/read/:path", async (c) => {
  try {
    const firebaseService = createFirebaseService(c.env);
    const path = c.req.param("path");
    const result = await firebaseService.readData(`test/${path}`);
    return c.json({ success: true, data: result });
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

app.patch("/test/firebase/update/:path", async (c) => {
  try {
    const firebaseService = createFirebaseService(c.env);
    const path = c.req.param("path");
    const data = await c.req.json();
    await firebaseService.updateData(`test/${path}`, data);
    return c.json({ success: true, message: "Data updated successfully" });
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

app.delete("/test/firebase/delete/:path", async (c) => {
  try {
    const firebaseService = createFirebaseService(c.env);
    const path = c.req.param("path");
    await firebaseService.deleteData(`test/${path}`);
    return c.json({ success: true, message: "Data deleted successfully" });
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

export default app;

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
