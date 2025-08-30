import { abis, deployment } from "@blitzdotfun/blitz-contracts/local"
import type { Account, Address } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { blitzWalletClient } from "../../services/clients"
import type { CreateBattleInput } from "./types"

async function createNewBattle(_body: CreateBattleInput) {
    const blitzAccount: Account = privateKeyToAccount(process.env.PRIVATE_KEY_BLITZ! as Address)

    // walletClient call to contract
    const _createCall = await blitzWalletClient.writeContract({
        account: blitzAccount,
        address: deployment.Blitz,
        abi: abis.Blitz,
        functionName: "startContest",
        args: [_body.creatorOneWallet, _body.creatorTwoWallet, _body.creatorOneCoin, _body.creatorTwoCoin],
    })
}

export { createNewBattle }
