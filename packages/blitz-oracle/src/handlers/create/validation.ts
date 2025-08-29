import { arktypeValidator } from "@hono/arktype-validator"
import { type } from "arktype"
import { checksum } from "ox/Address"
import type { Address as AddressType, Hex } from "viem"

function padHex(count: number): (hex: Hex) => Hex {
    return (hex: Hex) => `0x${hex.slice(2).padStart(count, "0")}`
}

const Address = type("/^0x[0-9a-fA-F]{0,40}$/").pipe(padHex(40)).pipe(checksum).as<AddressType>()

const createBattleInput = type({
    creatorOneWallet: Address,
    creatorTwoWallet: Address,
    creatorOneCoin: Address,
    creatorTwoCoin: Address,
})

export const createBattleBodyValidation = arktypeValidator("json", createBattleInput)
