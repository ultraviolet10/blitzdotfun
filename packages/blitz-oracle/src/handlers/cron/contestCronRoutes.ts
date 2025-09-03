import { Hono } from "hono"
import { monitorAllContests, monitoringHealthCheck } from "../../services/contestMonitor"
import { 
  getContestStatus, 
  getUserSpecificContestStatus, 
  getAllContestStatuses,
  getLightweightContestStatus 
} from "../contest/statusEndpoints"
import type { CloudflareBindings } from "../../types/env"

const cronApp = new Hono<{ Bindings: CloudflareBindings }>()

/**
 * Main cron job endpoint for monitoring contests
 * Called by Cloudflare Workers scheduled triggers
 */
cronApp.post("/monitor-contests", async (c) => {
  try {
    console.log("🔄 Cron job triggered: monitoring contests")
    
    await monitorAllContests(c.env)
    
    return c.json({
      success: true,
      message: "Contest monitoring completed successfully",
      timestamp: Date.now()
    })
  } catch (error) {
    console.error("❌ Cron job failed:", error)
    
    return c.json({
      success: false,
      message: "Contest monitoring failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now()
    }, 500)
  }
})

/**
 * Health check endpoint for monitoring system
 */
cronApp.get("/health", async (c) => {
  try {
    const healthStatus = await monitoringHealthCheck()
    
    return c.json(healthStatus, healthStatus.status === "healthy" ? 200 : 503)
  } catch (error) {
    return c.json({
      status: "unhealthy",
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500)
  }
})

/**
 * Frontend polling endpoint - get current contest status
 * Optimized for frequent polling with caching headers
 */
cronApp.get("/contest/status", async (c) => {
  try {
    const contestId = c.req.query("contestId")
    const userWallet = c.req.query("userWallet")
    
    let status
    
    if (userWallet) {
      // Get user-specific status
      status = await getUserSpecificContestStatus(userWallet, contestId, c.env)
    } else {
      // Get general contest status
      status = await getContestStatus(contestId, c.env)
    }
    
    if (!status) {
      return c.json({
        success: false,
        message: "No active contest found"
      }, 404)
    }
    
    // Set caching headers for efficient polling
    c.header("Cache-Control", "public, max-age=10") // Cache for 10 seconds
    c.header("ETag", `"${status.contestId}-${status.lastUpdated}"`)
    
    return c.json({
      success: true,
      data: status,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error("Error getting contest status:", error)
    
    return c.json({
      success: false,
      message: "Failed to get contest status",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500)
  }
})

/**
 * Lightweight polling endpoint for high-frequency checks
 * Returns minimal data for efficient polling
 */
cronApp.get("/contest/status/lightweight", async (c) => {
  try {
    const contestId = c.req.query("contestId")
    
    const status = await getLightweightContestStatus(contestId, c.env)
    
    if (!status) {
      return c.json({
        success: false,
        message: "No active contest found"
      }, 404)
    }
    
    // Aggressive caching for lightweight endpoint
    c.header("Cache-Control", "public, max-age=5") // Cache for 5 seconds
    c.header("ETag", `"${status.contestId}-${status.lastUpdated}"`)
    
    return c.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error("Error getting lightweight contest status:", error)
    
    return c.json({
      success: false,
      message: "Failed to get contest status"
    }, 500)
  }
})

/**
 * Admin endpoint to get all contest statuses
 */
cronApp.get("/admin/contests/all", async (c) => {
  try {
    const statuses = await getAllContestStatuses(c.env)
    
    return c.json({
      success: true,
      data: statuses,
      count: statuses.length,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error("Error getting all contest statuses:", error)
    
    return c.json({
      success: false,
      message: "Failed to get contest statuses",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500)
  }
})

/**
 * Server-Sent Events endpoint for real-time updates
 * Alternative to polling for better real-time experience
 */
cronApp.get("/contest/status/stream", async (c) => {
  const contestId = c.req.query("contestId")
  const userWallet = c.req.query("userWallet")
  
  // Set SSE headers
  c.header("Content-Type", "text/event-stream")
  c.header("Cache-Control", "no-cache")
  c.header("Connection", "keep-alive")
  c.header("Access-Control-Allow-Origin", "*")
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = async () => {
        try {
          let status
          
          if (userWallet) {
            status = await getUserSpecificContestStatus(userWallet, contestId, c.env)
          } else {
            status = await getContestStatus(contestId, c.env)
          }
          
          if (status) {
            const data = `data: ${JSON.stringify({
              type: "status_update",
              data: status,
              timestamp: Date.now()
            })}\n\n`
            
            controller.enqueue(new TextEncoder().encode(data))
          }
        } catch (error) {
          console.error("SSE update error:", error)
          const errorData = `data: ${JSON.stringify({
            type: "error",
            message: "Failed to get status update",
            timestamp: Date.now()
          })}\n\n`
          
          controller.enqueue(new TextEncoder().encode(errorData))
        }
      }
      
      // Send initial update
      sendUpdate()
      
      // Send updates every 10 seconds
      const interval = setInterval(sendUpdate, 10000)
      
      // Cleanup on close
      return () => {
        clearInterval(interval)
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*"
    }
  })
})

export { cronApp }
