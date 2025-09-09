/**
 * ROUTING WRAPPER
 *
 * Component that handles automatic routing based on user type and contest status.
 * Should wrap all authenticated pages to ensure proper navigation flow.
 */

"use client"

import { useRouting } from "@/hooks/useRouting"
import { ReactNode } from "react"

interface RoutingWrapperProps {
    children: ReactNode
}

export function RoutingWrapper({ children }: RoutingWrapperProps) {
    const { loading } = useRouting()

    // Show loading state while routing logic is determining where to go
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
                    <span className="text-[#67CE67]">Loading...</span>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
