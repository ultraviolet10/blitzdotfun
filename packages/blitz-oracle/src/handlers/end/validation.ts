/**
 * @todo [uv1000]
 * function endContest(
        bytes32 battleId,
        uint256 playerOneScore,
        uint256 playerTwoScore,
        address[] calldata topCollectors,
        uint256[] calldata collectorBalances
    )
 */

import { arktypeValidator } from "@hono/arktype-validator"
import { type } from "arktype"

const endBattleInput = type({
    battleId: type("string"),
})

export const endBattleBodyValidation = arktypeValidator("json", endBattleInput)
