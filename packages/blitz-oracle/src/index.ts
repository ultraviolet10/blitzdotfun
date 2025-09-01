import { app } from "./server/index"
import { checkContestDeposits } from "./services/depositMonitor"

export default {
    // cf workers define the app port in wrangler.jsonc, so we don't need it here
    fetch: app.fetch,
    // Handle scheduled cron triggers
    async scheduled(event: any, _env: any, _ctx: any) {
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
