import type { Address, Hex } from "viem"

export type CreateBattleInput = {
    creatorOneWallet: Address
    creatorTwoWallet: Address
    creatorOneCoin: Address
    creatorTwoCoin: Address
}

// [uv1000] todo
export type CreateBattleOutput = {
    battleId: Hex
}
