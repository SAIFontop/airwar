import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'SaifControl — لوحة تحكم FiveM',
    description: 'لوحة تحكم احترافية لإدارة سيرفر FiveM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ar" dir="rtl" className="dark">
            <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
                {children}
            </body>
        </html>
    );
}
