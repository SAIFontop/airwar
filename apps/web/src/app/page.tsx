'use client';

import SetupWizard from '@/components/setup/SetupWizard';
import { setupApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomePage() {
    const [checking, setChecking] = useState(true);
    const [setupDone, setSetupDone] = useState(false);

    useEffect(() => {
        setupApi
            .getStatus()
            .then((res) => {
                setSetupDone(res.completed);
                if (res.completed) {
                    window.location.href = '/login';
                }
            })
            .catch(() => {
                // API not reachable — show setup
                setSetupDone(false);
            })
            .finally(() => setChecking(false));
    }, []);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        );
    }

    if (!setupDone) {
        return <SetupWizard />;
    }

    return null;
}
