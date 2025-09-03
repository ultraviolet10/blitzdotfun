import { abis, deployment } from "@blitzdotfun/blitz-contracts/local";
import { type Account, type Address, decodeEventLog } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { blitzPublicClient, blitzWalletClient } from "../../services/clients";
import { getActiveContest } from "../admin/createContest";
import type { CreateBattleInput } from "./types";
import type { CloudflareBindings } from "../../types/env";

async function createNewBattle(
  _body: CreateBattleInput,
  env?: CloudflareBindings
) {
  // Ensure there's an active contest before creating a battle
  const activeContest = await getActiveContest(env);
  if (!activeContest) {
    throw new Error(
      "No active contest found. Cannot create battle without an active contest."
    );
  }

  // Validate that the battle participants match the active contest participants
  const contestParticipants = [
    activeContest.participantOne.walletAddress,
    activeContest.participantTwo.walletAddress,
  ];
  const battleParticipants = [_body.creatorOneWallet, _body.creatorTwoWallet];

  const participantsMatch =
    battleParticipants.every((participant) =>
      contestParticipants.includes(participant)
    ) &&
    contestParticipants.every((participant) =>
      battleParticipants.includes(participant)
    );

  if (!participantsMatch) {
    throw new Error(
      `Battle participants must match active contest participants. Expected: ${contestParticipants.join(
        ", "
      )}, Got: ${battleParticipants.join(", ")}`
    );
  }

  const blitzAccount: Account = privateKeyToAccount(
    process.env.PRIVATE_KEY_BLITZ! as Address
  );

  // walletClient call to contract
  const createCall = await blitzWalletClient.writeContract({
    account: blitzAccount,
    address: deployment.Blitz,
    abi: abis.Blitz,
    functionName: "startContest",
    args: [
      _body.creatorOneWallet,
      _body.creatorTwoWallet,
      _body.creatorOneCoin,
      _body.creatorTwoCoin,
    ],
  });

  const createCallReceipt = await blitzPublicClient.waitForTransactionReceipt({
    hash: createCall,
  });

  if (createCallReceipt.status !== "success") {
    throw new Error("create call failed");
  }

  // Find and decode the BattleCreated event
  const battleCreatedLog = createCallReceipt.logs.find(
    (log) => log.topics[0] === "0x..." // The event signature hash for BattleCreated
  );

  if (!battleCreatedLog) {
    throw new Error("BattleCreated event not found in logs");
  }

  const decodedEvent = decodeEventLog({
    abi: abis.Blitz,
    data: battleCreatedLog.data,
    topics: battleCreatedLog.topics,
    eventName: "BattleCreated",
  });

  return {
    battleId: decodedEvent.args.battleId,
  };
}

export { createNewBattle };
