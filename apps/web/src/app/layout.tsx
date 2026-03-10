import { CommandPalette } from '@/components/command-palette';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { Providers } from '@/components/providers';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
    title: 'Saif Control System',
    description: 'Next-generation FiveM server management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
                <Providers>
                    <div className="flex h-screen overflow-hidden">
                        <Sidebar />
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <TopBar />
                            <main className="flex-1 overflow-y-auto p-6">
                                {children}
                            </main>
                        </div>
                    </div>
                    <CommandPalette />
                </Providers>
            </body>
        </html>
    );
}
