"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LuLayoutDashboard, LuClipboardList, LuMenu, LuX, LuLogOut, LuArrowLeft,
    LuLockKeyhole, LuChevronRight, LuHouse,
} from 'react-icons/lu';
import { useAppSelector, useAppDispatch } from '@/redux';
import { logout } from '@/redux/slices/authSlice';
import { LogoMark } from '@/components/shared/Logo';

const NAV = [
    { label: "Today's Work", href: '/dashboard/marketing', icon: LuLayoutDashboard, exact: true },
    { label: 'My Reports', href: '/dashboard/marketing/reports', icon: LuClipboardList },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    const [drawer, setDrawer] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, isAuthenticated, isRestoring } = useAppSelector((s) => s.auth);

    // Partner roles ride on the same `role` field the auth slice types as the
    // three storefront roles — read it as a plain string.
    const role = (user as { role?: string } | null)?.role;

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        router.push('/');
    };

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    if (isRestoring) {
        return (
            <div className="min-h-screen bg-[#F1F3F6] p-4 sm:p-8">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    <div className="h-56 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated || role !== 'marketing_officer') {
        return (
            <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 sm:p-9 max-w-md w-full text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                        <LuLockKeyhole size={26} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Field officer panel</h1>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                        This panel is for marketing officers on the marketplace field team.
                        Apply to join the team to get your beat and start filing daily reports.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                        <Link
                            href={isAuthenticated ? '/join/marketing-officer' : '/login?redirect=/join/marketing-officer'}
                            className="px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                            Apply as an officer
                        </Link>
                        <Link
                            href="/"
                            className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
                        >
                            Back to store
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const Nav = ({ onNav }: { onNav?: () => void }) => (
        <nav className="flex-1 py-3">
            {NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNav}
                        className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
                            active
                                ? 'bg-[var(--color-primary-lightest)] text-[var(--color-primary)]'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    >
                        <Icon size={16} className="shrink-0" />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-[#F1F3F6] flex">
            <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] bg-white border-r border-gray-100 flex-col z-40">
                <Link href="/" className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
                    <LogoMark imgClassName="h-[28px]" />
                    <span className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">Field</span>
                </Link>
                <div className="px-5 py-4 border-b border-gray-50">
                    <p className="text-[11px] text-gray-400 font-semibold">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Officer'}</p>
                </div>
                <Nav />
                <div className="py-3 border-t border-gray-50">
                    <Link href="/" className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-gray-500 hover:bg-gray-50">
                        <LuArrowLeft size={15} /> Back to store
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-[calc(100%-16px)] mx-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LuLogOut size={15} /> Logout
                    </button>
                </div>
            </aside>

            {drawer && (
                <>
                    <div className="fixed inset-0 bg-black/45 z-50 lg:hidden" onClick={() => setDrawer(false)} />
                    <div className="fixed inset-y-0 left-0 w-[264px] bg-white z-50 flex flex-col lg:hidden shadow-xl">
                        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-50">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Officer'}</p>
                                <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                            </div>
                            <button onClick={() => setDrawer(false)} aria-label="Close menu" className="p-1.5 text-gray-400">
                                <LuX size={20} />
                            </button>
                        </div>
                        <Nav onNav={() => setDrawer(false)} />
                        <div className="py-3 border-t border-gray-50">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-[calc(100%-16px)] mx-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-600"
                            >
                                <LuLogOut size={15} /> Logout
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="flex-1 lg:ml-[240px] min-w-0 flex flex-col">
                <header className="sticky top-0 z-30 bg-white border-b border-gray-100 h-[54px] flex items-center gap-3 px-3.5 sm:px-6">
                    <button onClick={() => setDrawer(true)} aria-label="Open menu" className="lg:hidden p-1.5 text-gray-500">
                        <LuMenu size={20} />
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                        <Link href="/" className="flex text-gray-400"><LuHouse size={13} /></Link>
                        <LuChevronRight size={11} className="shrink-0" />
                        <span className="font-bold text-gray-900 truncate">Marketing Officer</span>
                    </div>
                </header>

                <main className="flex-1 p-3.5 sm:p-6">{children}</main>
            </div>
        </div>
    );
}
