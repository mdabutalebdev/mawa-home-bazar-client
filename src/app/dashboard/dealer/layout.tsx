"use client";

import React from 'react';
import Link from 'next/link';
import {
    LuLayoutDashboard, LuClipboardList, LuStore, LuUserRound,
    LuArrowLeft, LuShieldCheck, LuChevronRight, LuCircleAlert, LuInbox,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetMyDealerQuery } from '@/redux/api/dealerApi';
import PartnerShell, { PartnerNavItem } from '@/components/dashboard/PartnerShell';

const NAV: PartnerNavItem[] = [
    { name: 'Overview', href: '/dashboard/dealer', icon: LuLayoutDashboard, exact: true },
    { name: 'Orders', href: '/dashboard/dealer/orders', icon: LuClipboardList },
    { name: 'Order Requests', href: '/dashboard/dealer/order-requests', icon: LuInbox },
    { name: 'My Shops', href: '/dashboard/dealer/retailers', icon: LuStore },
    { name: 'Profile', href: '/dashboard/dealer/profile', icon: LuUserRound },
];

export default function DealerLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isRestoring } = useAppSelector((s) => s.auth);
    // The auth slice still types role as the storefront trio; marketplace roles
    // are granted server-side, so widen before comparing.
    const isDealer = (user?.role || '') === 'dealer';

    const { data: mineRes } = useGetMyDealerQuery(undefined, { skip: !isDealer });
    const dealer = mineRes?.data || null;

    // A restoring session knows nothing yet — deciding now would flash the
    // "not a dealer" card at a signed-in dealer on every refresh.
    if (isRestoring) {
        return (
            <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center text-sm text-gray-400">
                Loading...
            </div>
        );
    }

    if (!isAuthenticated || !isDealer) {
        return (
            <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[rgba(var(--color-primary-rgb),0.08)] flex items-center justify-center text-[var(--color-primary)] mb-4">
                        <LuShieldCheck size={26} />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">Dealer panel</h1>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        This dashboard belongs to the approved dealer of an area. Apply for your area to get access.
                    </p>
                    <Link
                        href="/join/dealer"
                        className="mt-5 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-all"
                    >
                        Become a dealer <LuChevronRight size={16} />
                    </Link>
                    <Link href="/" className="mt-3 inline-flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600">
                        <LuArrowLeft size={13} /> Back to store
                    </Link>
                </div>
            </div>
        );
    }

    const status = (() => {
        const s = dealer?.status;
        if (s === 'approved') return { label: 'Approved', tone: 'ok' as const };
        if (s === 'suspended') return { label: 'Suspended', tone: 'bad' as const };
        if (s === 'rejected') return { label: 'Rejected', tone: 'bad' as const };
        return { label: 'Under review', tone: 'warn' as const };
    })();

    const banner = dealer && dealer.status !== 'approved' ? (
        <div className="mx-[clamp(14px,3.5vw,24px)] mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
            <LuCircleAlert size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-800 leading-relaxed">
                {dealer.status === 'pending'
                    ? 'Your dealer application is under review. Orders start reaching you once the owner approves your area.'
                    : `Your dealer account is ${dealer.status}${dealer.rejectionReason ? ` — ${dealer.rejectionReason}` : ''}. Contact support to sort it out.`}
            </p>
        </div>
    ) : null;

    return (
        <PartnerShell
            roleLabel="Dealer panel"
            accountName={dealer?.name || user?.name || 'Dealer'}
            nav={NAV}
            homeHref="/dashboard/dealer"
            notificationHref="/dashboard/dealer"
            status={status}
            banner={banner}
        >
            {children}
        </PartnerShell>
    );
}
