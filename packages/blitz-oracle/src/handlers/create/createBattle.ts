import type { Address } from "ox/Address"
import type { Account } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { CreateBattleInput } from "./types"

async function createNewBattle(_body: CreateBattleInput) {
    const _blitzAccount: Account = privateKeyToAccount(process.env.PRIVATE_KEY_BLITZ! as Address)

    // walletClient call to contract
    // const _createCall = await blitzWalletClient.writeContract({
    //     account: blitzAccount,
    //     address: blitzAddress,
    //     abi: blitzAbi,
    //     functionName: "startContest"
    // })
}

export { createNewBattle }
