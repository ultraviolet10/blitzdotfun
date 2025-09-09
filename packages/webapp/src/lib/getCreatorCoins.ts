import { getProfileCoins, GetProfileCoinsResponse } from "@zoralabs/coins-sdk";

export type GetProfileCoinsParams = {
  identifier: string; // The user's wallet address or zora handle
  count?: number; // Optional: Number of coins to return per page (default: 20)
  after?: string; // Optional: Pagination cursor for fetching next page
  chainIds?: Array<number>; // Optional: Filter by specific chain IDs
  platformReferrerAddress?: Array<string>; // Optional: Filter by platform referrer addresses
};

export async function getCreatorCoins(
  params: GetProfileCoinsParams
): Promise<GetProfileCoinsResponse | null> {
  try {
    const response = await getProfileCoins({
      identifier: params.identifier,
      count: params.count || 20,
      after: params.after,
      chainIds: params.chainIds,
      platformReferrerAddress: params.platformReferrerAddress,
    });

    if (!response?.data?.profile) {
      console.warn(`No profile found for identifier: ${params.identifier}`);
      return null;
    }

    const profileData = response.data as GetProfileCoinsResponse;

    return profileData;
  } catch (error) {
    console.error(
      `Failed to fetch creator coins for ${params.identifier}:`,
      error
    );
    return null;
  }
}

// Helper function to get coins for a specific creator address
export async function getCreatorCoinsByAddress(
  address: string,
  count?: number
): Promise<GetProfileCoinsResponse | null> {
  return getCreatorCoins({
    identifier: address,
    count: count || 20,
  });
}

// Helper function to extract the first coin data from profile
export function getFirstCoinFromProfile(profileData: GetProfileCoinsResponse) {
  const firstCoin = profileData?.profile?.createdCoins?.edges?.[0]?.node;
  return firstCoin || null;
}
