import { Providers } from '@/components/providers';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'SaifControl — FiveM Server Panel',
    description: 'Professional FiveM server management panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
            <body className="font-sans antialiased bg-bg text-text min-h-screen">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
