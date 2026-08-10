"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LuBike,
    LuClipboardList,
    LuHistory,
    LuLogOut,
    LuShieldCheck,
    LuChevronRight,
    LuArrowLeft,
    LuHourglass,
    LuBan,
    LuCircleX,
} from 'react-icons/lu';
import { useAppSelector, useAppDispatch } from '@/redux';
import { logout } from '@/redux/slices/authSlice';
import { useGetMyDeliveryManQuery } from '@/redux/api/deliveryApi';

const NAV = [
    { label: 'Today', href: '/dashboard/rider', icon: LuClipboardList, exact: true },
    { label: 'History', href: '/dashboard/rider/history', icon: LuHistory },
];

/** Full-screen card used for every "you cannot be here" outcome. */
const Gate = ({
    tone, icon: Icon, title, body, cta,
}: {
    tone: string;
    icon: React.ElementType;
    title: string;
    body: string;
    cta?: { href: string; label: string };
}) => (
    <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-7 sm:p-9 text-center">
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${tone}`}>
                <Icon size={26} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{body}</p>
            {cta && (
                <Link
                    href={cta.href}
                    className="mt-6 inline-flex items-center justify-center gap-2 w-full min-h-[48px] px-5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                    {cta.label} <LuChevronRight size={16} />
                </Link>
            )}
            <Link
                href="/"
                className="mt-3 inline-flex items-center justify-center gap-2 w-full min-h-[44px] text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
                <LuArrowLeft size={13} /> Back to store
            </Link>
        </div>
    </div>
);

export default function RiderLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, isAuthenticated, isRestoring } = useAppSelector((s) => s.auth);

    // Partner roles ride on the same `role` field the auth slice types as the
    // storefront trio — read it as a plain string before comparing.
    const role = (user as { role?: string } | null)?.role;
    const isRider = isAuthenticated && role === 'delivery_man';

    // `/delivery/me` is open to any signed-in user, so a rider whose application
    // is still pending can be told why the job list is empty instead of
    // watching every request 403.
    const { data: profileRes, isLoading: profileLoading } = useGetMyDeliveryManQuery(undefined, {
        skip: !isRider,
    });
    const profile = profileRes?.data as { name?: string; status?: string; rejectionReason?: string } | undefined;

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        router.push('/');
    };

    // Deciding while the stored session is still being exchanged would flash the
    // "riders only" card at a signed-in rider on every refresh.
    if (isRestoring) {
        return (
            <div className="min-h-screen bg-[#F1F3F6] p-4">
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="h-14 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!isRider) {
        return (
            <Gate
                tone="bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                icon={LuShieldCheck}
                title="Delivery riders only"
                body="This app belongs to the riders who carry parcels for a dealer. Apply to a dealer in your upazila to get your own job list."
                cta={{ href: '/join', label: 'Join as a rider' }}
            />
        );
    }

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-[#F1F3F6] p-4">
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="h-14 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                </div>
            </div>
        );
    }

    // No profile behind the role (404), or one that is not cleared to ride:
    // every rider endpoint would answer 403, so say so plainly here.
    if (!profile) {
        return (
            <Gate
                tone="bg-amber-50 text-amber-500"
                icon={LuHourglass}
                title="No rider profile yet"
                body="We could not find a delivery man profile on your account. Apply to a dealer in your upazila and the owner will review it."
                cta={{ href: '/join', label: 'Apply as a rider' }}
            />
        );
    }

    if (profile.status !== 'approved') {
        const pending = profile.status === 'pending';
        return (
            <Gate
                tone={pending ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'}
                icon={pending ? LuHourglass : profile.status === 'suspended' ? LuBan : LuCircleX}
                title={
                    pending
                        ? 'Your application is under review'
                        : profile.status === 'suspended'
                            ? 'Your rider account is suspended'
                            : 'Your application was not approved'
                }
                body={
                    profile.rejectionReason
                        || (pending
                            ? 'The owner is checking your details. You will start receiving deliveries as soon as it is approved.'
                            : 'Please contact your dealer or the marketplace owner to sort this out.')
                }
            />
        );
    }

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <div className="min-h-screen bg-[#F1F3F6]">
            <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
                <div className="max-w-2xl mx-auto h-14 flex items-center gap-3 px-4">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0">
                        <LuBike size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate leading-tight">
                            {profile.name || user?.name || 'Rider'}
                        </p>
                        <p className="text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wide">
                            Delivery rider
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        aria-label="Log out"
                        className="w-11 h-11 -mr-2 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LuLogOut size={18} />
                    </button>
                </div>
            </header>

            {/* pb clears the fixed tab bar so the last card is never trapped under it */}
            <main className="max-w-2xl mx-auto p-4 pb-28">{children}</main>

            <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
                <div className="max-w-2xl mx-auto flex">
                    {NAV.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href, item.exact);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex-1 min-h-[60px] flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
                                    active ? 'text-[var(--color-primary)]' : 'text-gray-400'
                                }`}
                            >
                                <Icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
