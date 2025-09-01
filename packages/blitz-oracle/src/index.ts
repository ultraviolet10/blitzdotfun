import { app } from "./server/index"
import { checkContestDeposits } from "./services/depositMonitor"
import type { CloudflareBindings } from "./types/env"
import type { ExecutionContext, ScheduledEvent } from "./types/firebase"

export default {
    // cf workers define the app port in wrangler.jsonc, so we don't need it here
    fetch: app.fetch,
    // Handle scheduled cron triggers
    async scheduled(event: ScheduledEvent, _env: CloudflareBindings, _ctx: ExecutionContext) {
        switch (event.cron) {
            case "* * * * *": // Every minute
                console.log("Running deposit monitoring cron...")
                await checkContestDeposits()
                break
            default:
                console.log("Unknown cron schedule:", event.cron)
        }
    },
}
