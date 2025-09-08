import type { Metadata } from "next"
import { Dela_Gothic_One, Geist, Geist_Mono, Nunito, Schibsted_Grotesk } from "next/font/google"
import "./globals.css"
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

const schibstedGrotesk = Schibsted_Grotesk({
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-schibsted-grotesk",
})

const delagothicOne = Dela_Gothic_One({
    subsets: ["latin"],
    display: "swap",
    weight: ["400"],
    variable: "--font-dela-gothic-one",
})

const nunito = Nunito({
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-nunito",
})

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
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${schibstedGrotesk.variable} ${delagothicOne.variable} ${nunito.variable} antialiased`}
            >
                <JotaiProvider>
                    <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
                </JotaiProvider>
            </body>
        </html>
    )
}
