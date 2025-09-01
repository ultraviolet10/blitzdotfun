import { arktypeValidator } from "@hono/arktype-validator"
import { type } from "arktype"
import { checksum } from "ox/Address"
import type { Address as AddressType, Hex } from "viem"

// Reuse the Address validator from existing validation
function _padHex(count: number): (hex: Hex) => Hex {
    return (hex: Hex) => `0x${hex.slice(2).padStart(count, "0")}`
}

const Address = type("/^0x[0-9a-fA-F]{40}$/").pipe(checksum).as<AddressType>()

// Contest participant validator
const contestParticipant = type({
    handle: "string",
    walletAddress: Address,
    "zoraProfile?": "string",
})

// Create contest input validator
const createContestInput = type({
    name: "string",
    participantOne: contestParticipant,
    participantTwo: contestParticipant,
    contractAddress: Address,
})

export const createContestBodyValidation = arktypeValidator("json", createContestInput)
