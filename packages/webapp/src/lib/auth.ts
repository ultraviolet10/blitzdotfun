import { prisma } from "./prisma"

export interface PrivyUser {
    id: string
    createdAt: string
    // BlitzUser derived fields
    walletAddress?: string
    walletType?: string
    isZoraLogin?: boolean
    // Raw Privy data
    wallet?: {
        address: string
        walletClientType?: string
    }
    linkedAccounts?: Array<{
        type: string
        smartWallets?: Array<{
            address: string
        }>
    }>
    // Zora profile data
    zoraProfile?: {
        id?: string
        handle?: string
        username?: string
        displayName?: string
        bio?: string
        website?: string
        avatar?: {
            small?: string
            medium?: string
            blurhash?: string
        }
    }
}

/**
 * Sync Privy user data with the database
 * Creates or updates user record with wallet and linked account information
 */
export async function syncPrivyUser(privyUser: PrivyUser) {
    try {
        // Upsert the main user record with BlitzUser fields
        const user = await prisma.user.upsert({
            where: { id: privyUser.id },
            update: {
                walletAddress: privyUser.walletAddress,
                walletType: privyUser.walletType,
                isZoraLogin: privyUser.isZoraLogin || false,
                updatedAt: new Date(),
            },
            create: {
                id: privyUser.id,
                createdAt: new Date(privyUser.createdAt),
                walletAddress: privyUser.walletAddress,
                walletType: privyUser.walletType,
                isZoraLogin: privyUser.isZoraLogin || false,
            },
        })

        // Handle direct wallet connection
        if (privyUser.wallet?.address) {
            await prisma.wallet.upsert({
                where: { address: privyUser.wallet.address },
                update: {
                    walletClientType: privyUser.wallet.walletClientType,
                    updatedAt: new Date(),
                },
                create: {
                    address: privyUser.wallet.address,
                    walletClientType: privyUser.wallet.walletClientType,
                    userId: privyUser.id,
                },
            })
        }

        // Handle linked accounts and smart wallets
        if (privyUser.linkedAccounts) {
            for (const linkedAccount of privyUser.linkedAccounts) {
                // Find existing linked account or create new one
                let dbLinkedAccount = await prisma.linkedAccount.findFirst({
                    where: {
                        userId: privyUser.id,
                        type: linkedAccount.type,
                    },
                })

                if (dbLinkedAccount) {
                    // Update existing
                    dbLinkedAccount = await prisma.linkedAccount.update({
                        where: { id: dbLinkedAccount.id },
                        data: { updatedAt: new Date() },
                    })
                } else {
                    // Create new
                    dbLinkedAccount = await prisma.linkedAccount.create({
                        data: {
                            type: linkedAccount.type,
                            userId: privyUser.id,
                        },
                    })
                }

                // Handle smart wallets for this linked account
                if (linkedAccount.smartWallets) {
                    for (const smartWallet of linkedAccount.smartWallets) {
                        await prisma.smartWallet.upsert({
                            where: { address: smartWallet.address },
                            update: {
                                updatedAt: new Date(),
                            },
                            create: {
                                address: smartWallet.address,
                                linkedAccountId: dbLinkedAccount.id,
                            },
                        })
                    }
                }
            }
        }

        // Handle Zora profile data
        if (privyUser.zoraProfile) {
            await prisma.zoraProfile.upsert({
                where: { userId: privyUser.id },
                update: {
                    zoraId: privyUser.zoraProfile.id,
                    handle: privyUser.zoraProfile.handle,
                    username: privyUser.zoraProfile.username,
                    displayName: privyUser.zoraProfile.displayName,
                    bio: privyUser.zoraProfile.bio,
                    website: privyUser.zoraProfile.website,
                    avatar: privyUser.zoraProfile.avatar || undefined,
                    updatedAt: new Date(),
                },
                create: {
                    userId: privyUser.id,
                    zoraId: privyUser.zoraProfile.id,
                    handle: privyUser.zoraProfile.handle,
                    username: privyUser.zoraProfile.username,
                    displayName: privyUser.zoraProfile.displayName,
                    bio: privyUser.zoraProfile.bio,
                    website: privyUser.zoraProfile.website,
                    avatar: privyUser.zoraProfile.avatar || undefined,
                },
            })
        }

        return user
    } catch (error) {
        console.error("Error syncing Privy user:", error)
        throw error
    }
}

/**
 * Get user with all related data
 */
export async function getUserWithWallets(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            wallet: true,
            linkedAccounts: {
                include: {
                    smartWallets: true,
                },
            },
        },
    })
}
