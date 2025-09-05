/**
 * ENHANCED ZORA HOOK WITH STATE MANAGEMENT
 *
 * This hook provides functionality to fetch Zora profile data and manage it within
 * the global compound user state using Jotai atoms.
 *
 * Key features:
 * - Fetches Zora profile data from the Zora Coins SDK
 * - Manages loading and error states globally via Jotai atoms
 * - Provides two methods: basic fetch and state-managed fetch
 * - Integrates seamlessly with the compound user state system
 *
 * Usage:
 * - fetchZoraProfile(): Use this for most cases - handles state management automatically
 * - getZoraUserProfileByAddress(): Use for direct API calls without state updates
 */

import { type GetProfileResponse, getProfile } from "@zoralabs/coins-sdk"
import { useAtom } from "jotai"
import { useCallback } from "react"
import type { Address } from "viem"
import { errorsAtom, loadingAtom, profileDataAtom } from "@/atoms/userAtoms"

export const useZora = () => {
    const [, setProfileData] = useAtom(profileDataAtom)
    const [, setLoading] = useAtom(loadingAtom)
    const [, setErrors] = useAtom(errorsAtom)

    /**
     * Basic Zora profile fetch function that directly calls the Zora API.
     * This doesn't update any global state - just returns the data.
     * Use this when you need raw profile data without affecting the global state.
     */
    const getZoraUserProfileByAddress = useCallback(async (userAddress: Address) => {
        try {
            let zoraProfileDetails: GetProfileResponse["profile"] | undefined
            const userResponse = await getProfile({
                identifier: userAddress,
            })

            if (!userResponse.response.ok) {
                return undefined
            } else {
                zoraProfileDetails = userResponse.data?.profile
                return zoraProfileDetails
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }, [])

    /**
     * Enhanced fetch function that manages global state via Jotai atoms.
     * This is the recommended method for most use cases as it:
     * - Sets loading states so UI can show spinners
     * - Updates the global profile data when successful
     * - Sets error states so UI can display error messages
     * - Clears loading states when done
     */
    const fetchZoraProfile = useCallback(
        async (userAddress: Address) => {
            setLoading({ profile: true })
            setErrors({ profile: null })

            try {
                const profile = await getZoraUserProfileByAddress(userAddress)
                setProfileData({ data: profile })
                return profile
            } catch (error) {
                const errorObj = error instanceof Error ? error : new Error("Failed to fetch Zora profile")
                setErrors({ profile: errorObj })
                throw errorObj
            } finally {
                setLoading({ profile: false })
            }
        },
        [getZoraUserProfileByAddress, setProfileData, setLoading, setErrors],
    )

    return {
        getZoraUserProfileByAddress,
        fetchZoraProfile,
    }
}
