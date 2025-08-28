import { app } from "./server/index"

export default {
    // cf workers define the app port in wrangler.jsonc, so we don't need it here
    fetch: app.fetch
}