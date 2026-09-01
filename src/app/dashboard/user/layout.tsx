"use client";

import { Suspense } from 'react';
import UserLayout from '@/components/user/UserLayout';
import AuthGuard from '@/components/shared/AuthGuard';

export default function UserDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // The customer account panel is for regular buyers only — partners
        // (company/dealer/retailer) have their own dashboards. AuthGuard sees a
        // role mismatch and forwards them to their own home. Admin is exempt.
        <AuthGuard requiredRole="user">
            {/* Suspense — UserLayout reads useSearchParams (cancellations tab highlight) */}
            <Suspense fallback={null}>
                <UserLayout>{children}</UserLayout>
            </Suspense>
        </AuthGuard>
    );
}
