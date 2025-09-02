import type { Metadata } from 'next';
import { Syne, Schibsted_Grotesk, Dela_Gothic_One, Nunito } from 'next/font/google';

import { getSession } from '~/auth';
import '~/app/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { APP_NAME, APP_DESCRIPTION } from '~/lib/constants';
import { ClientProviders } from '~/components/ClientProviders';

// Initialize the Syne font
const syne = Syne({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
});

const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-schibsted-grotesk',
});

const delagothicOne = Dela_Gothic_One({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-dela-gothic-one',
});

const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
});


export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className={`${syne.variable} ${schibstedGrotesk.variable} ${delagothicOne.variable} ${nunito.variable}`}>
      <body>
        <ClientProviders session={session}>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
