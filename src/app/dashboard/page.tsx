"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/redux/hooks';
import { dashboardForRole } from '@/lib/dashboardForRole';

// /dashboard is a role-aware forwarder — the role's own guard will handle
// unauthenticated / mismatched-role redirects, so this only needs to pick the
// right shell to send them to. Prevents partners from being flashed through
// /dashboard/admin's role-mismatch redirect on every visit to /dashboard.
export default function DashboardPage() {
    const router = useRouter();
    const { user, isRestoring } = useAppSelector((s) => s.auth);

    useEffect(() => {
        if (isRestoring) return;
        // No user yet → send them to admin as before; that route's AuthGuard
        // will forward to /login with the right redirect param.
        router.replace(dashboardForRole(user?.role) || '/dashboard/admin');
    }, [isRestoring, user?.role, router]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">
            Loading dashboard…
        </div>
    );
}
