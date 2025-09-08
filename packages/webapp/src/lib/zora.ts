import { getProfile } from "@zoralabs/coins-sdk"

export interface ZoraProfileData {
    id?: string
    handle?: string
    displayName?: string
    bio?: string
    username?: string
    website?: string
    avatar?: {
        small?: string
        medium?: string
        blurhash?: string
    }
    publicWallet?: {
        walletAddress?: string
    }
    socialAccounts?: {
        instagram?: { username?: string; displayName?: string }
        tiktok?: { username?: string; displayName?: string }
        twitter?: { username?: string; displayName?: string }
        farcaster?: { username?: string; displayName?: string }
    }
    linkedWallets?: {
        edges?: Array<{
            node?: {
                walletType?: "PRIVY" | "EXTERNAL" | "SMART_WALLET"
                walletAddress?: string
            }
        }>
    }
    creatorCoin?: {
        address?: string
        marketCap?: string
        marketCapDelta24h?: string
    }
}

export async function fetchZoraProfile(identifier: string): Promise<ZoraProfileData | null> {
    try {
        const response = await getProfile({ identifier })
        const profile = response?.data?.profile

        if (!profile) {
            console.log(`No Zora profile found for identifier: ${identifier}`)
            return null
        }

        // Map the response to our ZoraProfileData type
        const profileData: ZoraProfileData = {
            id: profile.id,
            handle: profile.handle,
            displayName: profile.displayName,
            bio: profile.bio,
            username: profile.username,
            website: profile.website,
            avatar: profile.avatar
                ? {
                      small: profile.avatar.small,
                      medium: profile.avatar.medium,
                      blurhash: profile.avatar.blurhash,
                  }
                : undefined,
            publicWallet: profile.publicWallet
                ? {
                      walletAddress: profile.publicWallet.walletAddress,
                  }
                : undefined,
            socialAccounts: profile.socialAccounts
                ? {
                      instagram: profile.socialAccounts.instagram,
                      tiktok: profile.socialAccounts.tiktok,
                      twitter: profile.socialAccounts.twitter,
                      farcaster: profile.socialAccounts.farcaster,
                  }
                : undefined,
            linkedWallets: profile.linkedWallets,
            creatorCoin: profile.creatorCoin
                ? {
                      address: profile.creatorCoin.address,
                      marketCap: profile.creatorCoin.marketCap,
                      marketCapDelta24h: profile.creatorCoin.marketCapDelta24h,
                  }
                : undefined,
        }

        return profileData
    } catch (error) {
        console.error(`Error fetching Zora profile for ${identifier}:`, error)
        return null
    }
}
