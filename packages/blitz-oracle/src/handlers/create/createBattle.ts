import { abis, deployment } from "@blitzdotfun/blitz-contracts/local"
import { type Account, type Address, decodeEventLog } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { blitzPublicClient, blitzWalletClient } from "../../services/clients"
import type { CreateBattleInput } from "./types"

async function createNewBattle(_body: CreateBattleInput) {
    const blitzAccount: Account = privateKeyToAccount(process.env.PRIVATE_KEY_BLITZ! as Address)

    // walletClient call to contract
    const createCall = await blitzWalletClient.writeContract({
        account: blitzAccount,
        address: deployment.Blitz,
        abi: abis.Blitz,
        functionName: "startContest",
        args: [_body.creatorOneWallet, _body.creatorTwoWallet, _body.creatorOneCoin, _body.creatorTwoCoin],
    })

    const createCallReceipt = await blitzPublicClient.waitForTransactionReceipt({
        hash: createCall,
    })

    if (createCallReceipt.status !== "success") {
        throw new Error("create call failed")
    }

    // Find and decode the BattleCreated event
    const battleCreatedLog = createCallReceipt.logs.find(
        (log) => log.topics[0] === "0x...", // The event signature hash for BattleCreated
    )

    if (!battleCreatedLog) {
        throw new Error("BattleCreated event not found in logs")
    }

    const decodedEvent = decodeEventLog({
        abi: abis.Blitz,
        data: battleCreatedLog.data,
        topics: battleCreatedLog.topics,
        eventName: "BattleCreated",
    })

    return {
        battleId: decodedEvent.args.battleId,
    }
}

export { createNewBattle }
