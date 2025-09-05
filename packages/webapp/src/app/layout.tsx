import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider as JotaiProvider } from "jotai"
import { PrivyProviderWrapper } from "@/providers/PrivyProvider"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

const queryClient = new QueryClient()

export const metadata: Metadata = {
    title: "Blitz",
    description: "Creator battles on Zora",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <JotaiProvider>
                    <PrivyProviderWrapper>
                        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
                    </PrivyProviderWrapper>
                </JotaiProvider>
            </body>
        </html>
    )
}
