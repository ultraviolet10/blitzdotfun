import { checkContestDeposits } from "./depositMonitor"
import { checkContestContent } from "./contentMonitor"
import type { CloudflareBindings } from "../types/env"

/**
 * Unified contest monitoring system that handles all status transitions
 * This is the main entry point for cron jobs
 */
export async function monitorAllContests(env?: CloudflareBindings) {
    console.log("🔄 Starting unified contest monitoring...")
    
    try {
        // Monitor deposits for contests in "awaiting_deposits" status
        await checkContestDeposits(env)
        
        // Monitor content submissions for contests in "awaiting_content" status
        await checkContestContent(env)
        
        console.log("✅ Contest monitoring cycle completed successfully")
    } catch (error) {
        console.error("❌ Error during contest monitoring:", error)
        throw error
    }
}

/**
 * Health check function for monitoring system
 */
export async function monitoringHealthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    timestamp: number;
    services: {
        deposits: boolean;
        content: boolean;
    };
}> {
    const timestamp = Date.now()
    
    try {
        // Basic health checks for monitoring services
        const depositsHealthy = true // Could add actual health checks here
        const contentHealthy = true // Could add actual health checks here
        
        return {
            status: depositsHealthy && contentHealthy ? "healthy" : "unhealthy",
            timestamp,
            services: {
                deposits: depositsHealthy,
                content: contentHealthy,
            },
        }
    } catch (error) {
        console.error("Health check failed:", error)
        return {
            status: "unhealthy",
            timestamp,
            services: {
                deposits: false,
                content: false,
            },
        }
    }
}
