"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/redux';
import {
    LuLayoutDashboard,
    LuClipboardList,
    LuStore,
    LuUserRound,
    LuMenu,
    LuX,
    LuArrowLeft,
    LuShieldCheck,
    LuChevronRight,
} from 'react-icons/lu';

const NAV = [
    { label: 'Overview', href: '/dashboard/dealer', icon: LuLayoutDashboard },
    { label: 'Orders', href: '/dashboard/dealer/orders', icon: LuClipboardList },
    { label: 'My Shops', href: '/dashboard/dealer/retailers', icon: LuStore },
    { label: 'Profile', href: '/dashboard/dealer/profile', icon: LuUserRound },
];

export default function DealerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [drawer, setDrawer] = useState(false);
    const { user, isAuthenticated, isRestoring } = useAppSelector((s) => s.auth);
    // The auth slice still types role as the storefront trio; the marketplace
    // roles are granted server-side, so widen before comparing.
    const role = (user?.role || '') as string;

    useEffect(() => { setDrawer(false); }, [pathname]);

    const isActive = (href: string) =>
        href === '/dashboard/dealer' ? pathname === href : pathname.startsWith(href);

    const currentLabel = NAV.find((n) => isActive(n.href))?.label || 'Overview';

    // A restoring session knows nothing yet — deciding now would flash the
    // "not a dealer" card at a signed-in dealer on every refresh.
    if (isRestoring) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto space-y-4">
                    <div className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated || role !== 'dealer') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
                        <LuShieldCheck size={26} />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">Dealer panel</h1>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        This dashboard belongs to the approved dealer of an upazila.
                        Apply for your area to get access.
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

    const Nav = () => (
        <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            active
                                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                    >
                        <Icon size={17} className="shrink-0" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );

    const Brand = () => (
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {(user?.name || 'D').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Dealer'}</p>
                <p className="text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wide">Dealer</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-100 z-40">
                <Brand />
                <Nav />
                <div className="px-3 pb-4 border-t border-gray-100 pt-3">
                    <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all">
                        <LuArrowLeft size={16} /> Back to store
                    </Link>
                </div>
            </aside>

            {/* Mobile drawer */}
            {drawer && (
                <>
                    <div className="fixed inset-0 bg-black/45 z-40 lg:hidden" onClick={() => setDrawer(false)} />
                    <aside className="fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col lg:hidden shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100">
                            <div className="flex-1 min-w-0"><Brand /></div>
                            <button
                                onClick={() => setDrawer(false)}
                                aria-label="Close menu"
                                className="p-4 text-gray-400 hover:text-gray-700"
                            >
                                <LuX size={20} />
                            </button>
                        </div>
                        <Nav />
                        <div className="px-3 pb-4 border-t border-gray-100 pt-3">
                            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-50">
                                <LuArrowLeft size={16} /> Back to store
                            </Link>
                        </div>
                    </aside>
                </>
            )}

            <div className="lg:ml-60 flex flex-col min-h-screen">
                <header className="sticky top-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center gap-3 px-4 sm:px-6">
                    <button
                        onClick={() => setDrawer(true)}
                        aria-label="Open menu"
                        className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-800"
                    >
                        <LuMenu size={20} />
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                        <span className="hidden sm:inline">Dealer</span>
                        <LuChevronRight size={12} className="hidden sm:inline" />
                        <span className="font-bold text-gray-900 truncate">{currentLabel}</span>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
