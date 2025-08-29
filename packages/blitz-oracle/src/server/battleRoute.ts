import { Hono } from "hono"
import { createNewBattle } from "../handlers/create/createBattle"
import { createBattleBodyValidation } from "../handlers/create/validation"

export default new Hono() //
    .post(
        "/createNewBattle", //
        // [uv1000] openApi descriptor if you decide to do it
        createBattleBodyValidation,
        async (c) => {
            const input = c.req.valid("json")
            const _output = await createNewBattle(input)
        },
    )
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
