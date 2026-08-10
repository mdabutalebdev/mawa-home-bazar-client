"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LuLayoutDashboard, LuPackage, LuShoppingBag, LuBuilding2,
    LuMenu, LuX, LuLogOut, LuArrowLeft, LuStore, LuLogIn,
    LuCircleAlert, LuExternalLink,
} from 'react-icons/lu';
import { useAppSelector, useAppDispatch } from '@/redux';
import { logout } from '@/redux/slices/authSlice';
import { useGetMyCompanyQuery } from '@/redux/api/companyApi';

const NAV = [
    { href: '/dashboard/company', label: 'Overview', icon: LuLayoutDashboard, exact: true },
    { href: '/dashboard/company/products', label: 'Products', icon: LuPackage },
    { href: '/dashboard/company/orders', label: 'Orders', icon: LuShoppingBag },
    { href: '/dashboard/company/profile', label: 'Profile', icon: LuBuilding2 },
];

/** Full-page card shown instead of the panel when the caller may not be here. */
const GateCard = ({
    icon: Icon, title, body, href, cta,
}: { icon: React.ElementType; title: string; body: string; href: string; cta: string }) => (
    <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center px-4 py-12">
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
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [drawer, setDrawer] = useState(false);

    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    // Redux state is lost on refresh, so a saved token has to be exchanged for
    // the user again — deciding before that settles would eject a signed-in
    // supplier back to the application form.
    const isRestoring = useAppSelector((s) => s.auth.isRestoring);
    const role = user?.role as string | undefined;
    const isCompany = role === 'company';

    const { data: mineRes } = useGetMyCompanyQuery(undefined, { skip: !isCompany });
    const company = mineRes?.data || null;

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        router.push('/');
    };

    if (isRestoring) {
        return (
            <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center text-sm text-gray-400">
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

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    const Nav = ({ onNav }: { onNav?: () => void }) => (
        <nav className="flex-1 px-2 py-3 space-y-1">
            {NAV.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNav}
                        className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors ${
                            active
                                ? 'bg-[rgba(var(--color-primary-rgb),0.09)] text-[var(--color-primary)]'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <item.icon size={17} className={active ? 'text-[var(--color-primary)]' : 'text-gray-400'} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );

    const statusPill = (() => {
        const s = company?.status;
        if (s === 'approved') return { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700' };
        if (s === 'suspended') return { label: 'Suspended', cls: 'bg-red-50 text-red-700' };
        if (s === 'rejected') return { label: 'Rejected', cls: 'bg-red-50 text-red-700' };
        return { label: 'Under review', cls: 'bg-amber-50 text-amber-700' };
    })();

    return (
        <div className="min-h-screen bg-[#F1F3F6]">
            {/* ── Desktop sidebar ── */}
            <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[248px] bg-white border-r border-gray-100 flex-col z-40">
                <Link href="/" className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center flex-shrink-0">
                        <LuStore size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-extrabold text-gray-900 truncate">Company panel</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mawa Homebazar</p>
                    </div>
                </Link>

                <div className="px-5 py-3.5 border-b border-gray-50">
                    <p className="text-sm font-extrabold text-gray-900 truncate">{company?.name || user.name}</p>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${statusPill.cls}`}>
                        {statusPill.label}
                    </span>
                </div>

                <Nav />

                <div className="px-2 py-3 border-t border-gray-50 space-y-1">
                    {company?.slug && (
                        <Link
                            href={`/companies/${company.slug}`}
                            className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            <LuExternalLink size={16} className="text-gray-400" /> View storefront
                        </Link>
                    )}
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <LuArrowLeft size={16} className="text-gray-400" /> Back to store
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 min-h-[44px] rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LuLogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* ── Mobile drawer ── */}
            {drawer && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/45" onClick={() => setDrawer(false)} />
                    <div className="absolute inset-y-0 left-0 w-[270px] bg-white flex flex-col shadow-xl">
                        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-50">
                            <div className="min-w-0">
                                <p className="text-sm font-extrabold text-gray-900 truncate">{company?.name || user.name}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${statusPill.cls}`}>
                                    {statusPill.label}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDrawer(false)}
                                aria-label="Close menu"
                                className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50"
                            >
                                <LuX size={20} />
                            </button>
                        </div>
                        <Nav onNav={() => setDrawer(false)} />
                        <div className="px-2 py-3 border-t border-gray-50 space-y-1">
                            {company?.slug && (
                                <Link
                                    href={`/companies/${company.slug}`}
                                    onClick={() => setDrawer(false)}
                                    className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50"
                                >
                                    <LuExternalLink size={16} className="text-gray-400" /> View storefront
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-3 min-h-[44px] rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                                <LuLogOut size={16} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Right column ── */}
            <div className="lg:ml-[248px] flex flex-col min-h-screen">
                <header className="sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center gap-3 px-3 sm:px-5 h-[56px]">
                    <button
                        type="button"
                        onClick={() => setDrawer(true)}
                        aria-label="Open menu"
                        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
                    >
                        <LuMenu size={20} />
                    </button>
                    <p className="text-sm font-extrabold text-gray-900 truncate">
                        {NAV.find((n) => isActive(n.href, n.exact))?.label || 'Company panel'}
                    </p>
                    <div className="ml-auto flex items-center gap-2">
                        <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${statusPill.cls}`}>
                            {statusPill.label}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                            {(company?.name || user.name || 'C').trim().charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Mobile tab strip — these users work from phones, so the four
                    sections stay one tap away without opening the drawer. */}
                <div className="lg:hidden bg-white border-b border-gray-100 flex gap-1.5 overflow-x-auto px-3 py-2">
                    {NAV.map((item) => {
                        const active = isActive(item.href, item.exact);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-xl text-[13px] font-bold whitespace-nowrap transition-colors ${
                                    active
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'bg-gray-50 text-gray-600'
                                }`}
                            >
                                <item.icon size={14} /> {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* A pending or suspended supplier keeps the panel but cannot trade —
                    every server call will refuse, so say why once, up front. */}
                {company && company.status !== 'approved' && (
                    <div className="mx-3 sm:mx-5 mt-3 sm:mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
                        <LuCircleAlert size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[13px] text-amber-800 leading-relaxed">
                            {company.status === 'pending'
                                ? 'Your application is under review. You can look around, but products and orders open up once the owner approves your company.'
                                : `Your company account is ${company.status}${company.rejectionReason ? ` — ${company.rejectionReason}` : ''}. Contact support to sort it out.`}
                        </p>
                    </div>
                )}

                <main className="flex-1 p-3 sm:p-5">{children}</main>
            </div>
        </div>
    );
}
