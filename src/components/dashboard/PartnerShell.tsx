"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { IconType } from 'react-icons';
import { LuMenu, LuX, LuLogOut, LuChevronLeft, LuExternalLink } from 'react-icons/lu';
import { useAppDispatch } from '@/redux';
import { logout } from '@/redux/slices/authSlice';
import NotificationBell from '@/components/notifications/NotificationBell';
import Logo from '@/components/shared/Logo';

/**
 * PartnerShell — the shared dashboard chrome for the Company and Dealer panels.
 *
 * It reuses the exact look of the main admin panel (dark navy sidebar, clean
 * white sticky header, soft-grey content) so every operator area of the
 * marketplace feels like one professional product. Each panel passes only its
 * own nav, labels and status.
 */

export interface PartnerNavItem {
    name: string;
    href: string;
    icon: IconType;
    /** Match exactly (used for the overview root) instead of by prefix. */
    exact?: boolean;
}

type StatusTone = 'ok' | 'warn' | 'bad';

interface PartnerShellProps {
    children: React.ReactNode;
    /** Small caption under the logo, e.g. "Company panel". */
    roleLabel: string;
    /** The business name shown in the sidebar + avatar. */
    accountName: string;
    nav: PartnerNavItem[];
    /** Dashboard root — the logo links here. */
    homeHref: string;
    /** Where the header notification bell "see all" goes. */
    notificationHref: string;
    /** Optional "View storefront" link (companies have a public page). */
    storefrontHref?: string;
    /** Optional approval-status pill in the header. */
    status?: { label: string; tone: StatusTone };
    /** Optional full-width alert under the header (pending / suspended notice). */
    banner?: React.ReactNode;
    /** Hide the notification bell (used by the design-preview route only). */
    hideNotifications?: boolean;
}

const SIDEBAR_W = 240;

const STATUS_CLS: Record<StatusTone, string> = {
    ok: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    bad: 'bg-red-50 text-red-700',
};

const PartnerShell: React.FC<PartnerShellProps> = ({
    children,
    roleLabel,
    accountName,
    nav,
    homeHref,
    notificationHref,
    storefrontHref,
    status,
    banner,
    hideNotifications,
}) => {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => { setMobileOpen(false); }, [pathname]);

    const isActive = (item: PartnerNavItem) =>
        item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

    const currentLabel = nav.find((n) => isActive(n))?.name || roleLabel;

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        router.push('/');
    };

    const avatarLetter = (accountName || roleLabel || 'M').trim().charAt(0).toUpperCase();

    const Sidebar = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo + role */}
            <div style={{
                minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', borderBottom: '1px solid #334155', flexShrink: 0,
            }}>
                <Link href={homeHref} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    <Logo light imgClassName="h-[30px] md:h-[34px]" />
                </Link>
                <button
                    className="lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '4px' }}
                >
                    <LuX size={18} />
                </button>
            </div>

            {/* Account line */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155', flexShrink: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {accountName}
                </p>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', margin: '3px 0 0' }}>
                    {roleLabel}
                </p>
            </div>

            {/* Nav */}
            <nav className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '0 10px 6px', margin: 0 }}>
                    Menu
                </p>
                {nav.map((item) => {
                    const active = isActive(item);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '9px 12px', borderRadius: '8px', textDecoration: 'none', marginBottom: '2px',
                                background: active ? 'var(--color-primary)' : 'transparent',
                                color: active ? '#fff' : '#cbd5e1',
                                fontSize: '13px', fontWeight: active ? 600 : 500,
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                            <item.icon size={16} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div style={{ padding: '8px 10px', borderTop: '1px solid #334155', flexShrink: 0 }}>
                {storefrontHref && (
                    <Link
                        href={storefrontHref}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                            borderRadius: '8px', textDecoration: 'none', color: '#94A3B8', fontSize: '13px', fontWeight: 500,
                        }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                        <LuExternalLink size={16} /> View storefront
                    </Link>
                )}
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px', borderRadius: '8px', background: 'none',
                        border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '13px', fontWeight: 500,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff0f0'; (e.currentTarget as HTMLElement).style.color = '#dc2626'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
                >
                    <LuLogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99, backdropFilter: 'blur(4px)' }}
                />
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:block" style={{
                position: 'fixed', top: 0, left: 0, width: `${SIDEBAR_W}px`, height: '100vh',
                background: '#1E293B', borderRight: '1px solid #334155', zIndex: 50, overflowY: 'hidden',
            }}>
                <Sidebar />
            </div>

            {/* Mobile sidebar */}
            <div className="lg:hidden" style={{
                position: 'fixed', top: 0, left: 0, width: '260px', height: '100vh',
                background: '#1E293B', borderRight: '1px solid #334155', zIndex: 100,
                transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.25s ease',
                boxShadow: mobileOpen ? '4px 0 20px rgba(0,0,0,0.1)' : 'none',
            }}>
                <Sidebar />
            </div>

            {/* Main */}
            <div className="lg:ml-[240px]" style={{ minHeight: '100vh' }}>
                {/* Header */}
                <header style={{
                    height: '56px', background: '#fff', borderBottom: '1px solid #f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 clamp(12px, 4vw, 24px)', position: 'sticky', top: 0, zIndex: 40,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <button
                            className="lg:hidden"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open menu"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }}
                        >
                            <LuMenu size={20} />
                        </button>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {currentLabel}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {status && (
                            <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${STATUS_CLS[status.tone]}`}>
                                {status.label}
                            </span>
                        )}
                        {!hideNotifications && <NotificationBell theme="indigo" seeAllHref={notificationHref} />}
                        <div style={{ width: '1px', height: '20px', background: '#efefef' }} className="hidden sm:block" />
                        <Link href="/" style={{
                            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600,
                            color: '#777', textDecoration: 'none', padding: '5px 10px', borderRadius: '6px',
                        }}
                            className="hidden sm:flex"
                            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#f5f5f5'}
                            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                            <LuChevronLeft size={13} /> Store
                        </Link>
                        <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>{avatarLetter}</div>
                    </div>
                </header>

                {banner}

                <main style={{ padding: 'clamp(14px, 3.5vw, 24px)', minHeight: 'calc(100vh - 56px)' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default PartnerShell;
