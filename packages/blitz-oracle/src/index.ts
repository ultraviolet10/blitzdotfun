import { app } from "./server/index"
import { monitorAllContests } from "./services/contestMonitor"
import type { CloudflareBindings } from "./types/env"
import type { ExecutionContext, ScheduledEvent } from "./types/firebase"

export default {
    // cf workers define the app port in wrangler.jsonc, so we don't need it here
    fetch: app.fetch,
    // Handle scheduled cron triggers
    async scheduled(event: ScheduledEvent, env: CloudflareBindings, _ctx: ExecutionContext) {
        console.log(`🔄 Scheduled event triggered: ${event.cron}`)
        
        try {
            switch (event.cron) {
                case "*/30 * * * * *": // Every 30 seconds - active monitoring
                case "*/2 * * * *":    // Every 2 minutes - fallback monitoring
                    console.log("Running unified contest monitoring...")
                    await monitorAllContests(env)
                    break
                case "*/5 * * * *":    // Every 5 minutes - health check
                    console.log("Running health check...")
                    // Health check is handled via HTTP endpoint
                    break
                default:
                    console.log("Unknown cron schedule:", event.cron)
            }
        } catch (error) {
            console.error("❌ Scheduled event failed:", error)
        }
    },
}
