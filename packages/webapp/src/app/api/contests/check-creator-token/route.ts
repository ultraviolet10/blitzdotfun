import { NextResponse, type NextRequest  } from 'next/server';
import { deployment, abis } from '@blitzdotfun/blitz-contracts/local';
import { getPublicClient } from '@/lib/viem';
import { anvil } from 'viem/chains';

/**
 * This route will take in 10% of the user's creator coin balance
 * and their token address and validate that the contract holds as much.Ready to Battle?
 */
export async function GET(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractAddress, amount } = body;

    if (!contractAddress || !amount) {
      return NextResponse.json(
        { error: 'Contract address and amount are required' },
        { status: 400 }
      );
    }

    const publicClient = getPublicClient(anvil.id);
    
    const balance = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: abis.MockTokenA,
      functionName: 'balanceOf',
      args: [deployment.Blitz],
    });
    
    return NextResponse.json({
      success: true,
      contractAddress,
      amount,
      balance: balance.toString(),
      hasEnoughBalance: BigInt(balance) >= BigInt(amount),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Invalid request body: ${error}` },
      { status: 400 }
    );
  }
}