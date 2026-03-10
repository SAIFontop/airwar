'use client';

import { setupApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RootPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        setupApi.getStatus()
            .then((data) => {
                if (data.completed) {
                    router.replace('/login');
                } else {
                    router.replace('/setup');
                }
            })
            .catch(() => {
                router.replace('/setup');
            })
            .finally(() => setChecking(false));
    }, [router]);

    if (!checking) return null;

    return (
        <div className="flex h-screen items-center justify-center bg-bg-primary">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p className="text-sm text-text-secondary">Initializing SaifControl...</p>
            </div>
        </div>
    );
}
