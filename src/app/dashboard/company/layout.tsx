"use client";

import React from 'react';
import Link from 'next/link';
import {
    LuLayoutDashboard, LuPackage, LuShoppingBag, LuBuilding2, LuTags,
    LuLogIn, LuCircleAlert,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetMyCompanyQuery } from '@/redux/api/companyApi';
import PartnerShell, { PartnerNavItem } from '@/components/dashboard/PartnerShell';

const NAV: PartnerNavItem[] = [
    { name: 'Overview', href: '/dashboard/company', icon: LuLayoutDashboard, exact: true },
    { name: 'Products', href: '/dashboard/company/products', icon: LuPackage },
    { name: 'Categories', href: '/dashboard/company/categories', icon: LuTags },
    { name: 'Orders', href: '/dashboard/company/orders', icon: LuShoppingBag },
    { name: 'Profile', href: '/dashboard/company/profile', icon: LuBuilding2 },
];

/** Full-page card shown instead of the panel when the caller may not be here. */
const GateCard = ({
    icon: Icon, title, body, href, cta,
}: { icon: React.ElementType; title: string; body: string; href: string; cta: string }) => (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.08)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                <Icon size={28} />
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 leading-relaxed mt-2">{body}</p>
            <Link
                href={href}
                className="inline-flex items-center justify-center gap-2 w-full mt-6 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold shadow-md shadow-[rgba(var(--color-primary-rgb),0.25)] hover:bg-[var(--color-primary-dark)] transition-colors"
            >
                {cta}
            </Link>
            <Link href="/" className="inline-block mt-3 text-xs font-bold text-gray-400 hover:text-[var(--color-primary)] transition-colors">
                Back to the store
            </Link>
        </div>
    </div>
);

export default function CompanyDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    // Redux state is lost on refresh, so a saved token has to be exchanged for
    // the user again — deciding before that settles would eject a signed-in
    // supplier back to the application form.
    const isRestoring = useAppSelector((s) => s.auth.isRestoring);
    const isCompany = (user?.role as string | undefined) === 'company';

    const { data: mineRes } = useGetMyCompanyQuery(undefined, { skip: !isCompany });
    const company = mineRes?.data || null;

    if (isRestoring) {
        return (
            <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center text-sm text-gray-400">
                Loading...
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <GateCard
                icon={LuLogIn}
                title="Sign in to open your company panel"
                body="This area is for approved supplier companies. Sign in with the account you applied with."
                href="/login?redirect=/dashboard/company"
                cta="Sign in"
            />
        );
    }

    if (!isCompany) {
        return (
            <GateCard
                icon={LuBuilding2}
                title="You do not have a company account"
                body="The company panel is for suppliers listing products on Mawa Homebazar. Apply once and you can manage your catalogue, orders and storefront from here."
                href="/join/company"
                cta="Apply as a company"
            />
        );
    }

    const status = (() => {
        const s = company?.status;
        if (s === 'approved') return { label: 'Approved', tone: 'ok' as const };
        if (s === 'suspended') return { label: 'Suspended', tone: 'bad' as const };
        if (s === 'rejected') return { label: 'Rejected', tone: 'bad' as const };
        return { label: 'Under review', tone: 'warn' as const };
    })();

    // A pending or suspended supplier keeps the panel but cannot trade — every
    // server call will refuse, so say why once, up front.
    const banner = company && company.status !== 'approved' ? (
        <div className="mx-[clamp(14px,3.5vw,24px)] mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
            <LuCircleAlert size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-800 leading-relaxed">
                {company.status === 'pending'
                    ? 'Your application is under review. You can look around, but products and orders open up once the owner approves your company.'
                    : `Your company account is ${company.status}${company.rejectionReason ? ` — ${company.rejectionReason}` : ''}. Contact support to sort it out.`}
            </p>
        </div>
    ) : null;

    return (
        <PartnerShell
            roleLabel="Company panel"
            accountName={company?.name || user.name}
            nav={NAV}
            homeHref="/dashboard/company"
            notificationHref="/dashboard/company"
            storefrontHref={company?.slug ? `/companies/${company.slug}` : undefined}
            status={status}
            banner={banner}
        >
            {children}
        </PartnerShell>
    );
}
