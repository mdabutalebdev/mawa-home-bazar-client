"use client";

import React from 'react';
import Link from 'next/link';
import {
    LuStore, LuWallet, LuPackage, LuTrendingUp, LuPhone, LuMapPin, LuTruck,
    LuLockKeyhole, LuClock, LuBadgeCheck, LuTriangleAlert, LuCircleAlert,
    LuBoxes, LuChevronRight, LuUserRound,
} from 'react-icons/lu';
import { BsWhatsapp } from 'react-icons/bs';
import { useAppSelector } from '@/redux';
import { useGetMyRetailerQuery } from '@/redux/api/retailerApi';
import { useGetDealerByUpazilaQuery } from '@/redux/api/dealerApi';

interface Area { _id: string; name?: string; bnName?: string }

interface Retailer {
    _id?: string;
    shopName?: string;
    ownerName?: string;
    shopType?: string;
    phone?: string;
    address?: string;
    status?: string;
    rejectionReason?: string;
    creditLimit?: number;
    creditUsed?: number;
    totalOrders?: number;
    totalPurchase?: number;
    upazila?: Area | string | null;
    district?: Area | string | null;
}

interface Dealer {
    _id: string;
    name?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    homeDelivery?: boolean;
}

const STATUS_VIEW: Record<string, { label: string; bg: string; text: string; icon: React.ElementType; note: string }> = {
    pending: {
        label: 'Under review', bg: 'bg-amber-50', text: 'text-amber-700', icon: LuClock,
        note: 'Your shop is being verified. Trade prices unlock once it is approved.',
    },
    approved: {
        label: 'Verified shop', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: LuBadgeCheck,
        note: 'Your shop is verified — wholesale prices are open to you.',
    },
    rejected: {
        label: 'Not approved', bg: 'bg-red-50', text: 'text-red-700', icon: LuTriangleAlert,
        note: 'Your shop could not be verified with the details provided.',
    },
    suspended: {
        label: 'Suspended', bg: 'bg-red-50', text: 'text-red-700', icon: LuCircleAlert,
        note: 'Wholesale ordering is paused for this shop. Contact us to restore access.',
    },
};

const taka = (n?: number) => `৳${Number(n || 0).toLocaleString()}`;

const idOf = (area: Area | string | null | undefined): string =>
    !area ? '' : typeof area === 'string' ? area : area._id || '';

const nameOf = (area: Area | string | null | undefined): string =>
    area && typeof area === 'object' ? area.name || '' : '';

/** wa.me only accepts the full international form. */
const waLink = (raw?: string): string => {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('880')) return `https://wa.me/${digits}`;
    return `https://wa.me/880${digits.replace(/^0+/, '')}`;
};

const StatCard = ({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
            <Icon size={18} />
        </div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
);

const Skeleton = () => (
    <div className="space-y-4">
        <div className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
        </div>
        <div className="h-44 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
);

export default function RetailerOverviewPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user as { role?: string } | null)?.role;
    const allowed = isAuthenticated && role === 'retailer';

    const { data: res, isLoading, error } = useGetMyRetailerQuery(undefined, { skip: !allowed });
    const retailer: Retailer | undefined = res?.data;

    // The dealer card is keyed on the shop's own upazila — the shopkeeper never
    // picks an area here, so there is nothing to get wrong.
    const upazilaId = idOf(retailer?.upazila);
    const { data: dealerRes, isLoading: dealerLoading } = useGetDealerByUpazilaQuery(upazilaId, { skip: !upazilaId });
    const dealer: Dealer | null = dealerRes?.data || null;

    if (!allowed) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                    <LuLockKeyhole size={26} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-2">Retailer access only</h1>
                <p className="text-sm text-gray-500 mb-6">Register your shop to see credit, orders and your local dealer.</p>
                <Link href="/join/retailer" className="inline-block px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
                    Register my shop
                </Link>
            </div>
        );
    }

    if (isLoading) return <Skeleton />;

    // A retailer role without a profile means the application record is missing.
    if (error || !retailer) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
                    <LuStore size={26} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-2">No shop on file</h1>
                <p className="text-sm text-gray-500 mb-6">
                    {(error as { data?: { message?: string } })?.data?.message
                        || 'We could not find a shop registered to your account.'}
                </p>
                <Link href="/join/retailer" className="inline-block px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
                    Register my shop
                </Link>
            </div>
        );
    }

    const status = retailer.status || 'pending';
    const view = STATUS_VIEW[status] || STATUS_VIEW.pending;
    const StatusIcon = view.icon;

    const limit = Number(retailer.creditLimit || 0);
    const used = Number(retailer.creditUsed || 0);
    const available = Math.max(0, limit - used);
    // A cash-only shop (limit 0) has no bar to fill — guard the division.
    const availablePct = limit > 0 ? Math.round((available / limit) * 100) : 0;
    const lowCredit = limit > 0 && availablePct <= 20;

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Shop header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-lightest)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                        <LuStore size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                                {retailer.shopName || 'My shop'}
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${view.bg} ${view.text}`}>
                                <StatusIcon size={12} /> {view.label}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {retailer.ownerName ? `${retailer.ownerName} · ` : ''}
                            {nameOf(retailer.upazila) || 'Area not set'}
                            {nameOf(retailer.district) ? `, ${nameOf(retailer.district)}` : ''}
                        </p>
                    </div>
                    {status === 'approved' && (
                        <Link
                            href="/wholesale"
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                            <LuBoxes size={16} /> Browse wholesale
                        </Link>
                    )}
                </div>
                <p className="text-[13px] text-gray-500 mt-4 pt-4 border-t border-gray-50">{view.note}</p>
                {status === 'rejected' && retailer.rejectionReason && (
                    <p className="text-[13px] text-red-600 mt-2">Reason: {retailer.rejectionReason}</p>
                )}
            </div>

            {/* Credit */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Credit line</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{taka(available)} <span className="text-sm font-semibold text-gray-400">available</span></p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                        <LuWallet size={18} />
                    </div>
                </div>

                {limit > 0 ? (
                    <>
                        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${lowCredit ? 'bg-amber-500' : 'bg-[var(--color-primary)]'}`}
                                style={{ width: `${availablePct}%` }}
                            />
                        </div>
                        <div className="flex flex-wrap justify-between gap-2 mt-2.5 text-xs">
                            <span className="text-gray-500">Used <strong className="text-gray-800">{taka(used)}</strong></span>
                            <span className="text-gray-500">Limit <strong className="text-gray-800">{taka(limit)}</strong></span>
                        </div>
                        {lowCredit && (
                            <p className="text-xs text-amber-600 mt-3">
                                Only {availablePct}% of your credit is left. Settle dues with your dealer to free up headroom.
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-[13px] text-gray-500">
                        No credit line yet — this shop buys on cash terms. Your dealer can request a limit for you.
                    </p>
                )}
            </div>

            {/* Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={LuPackage} label="Total orders" value={String(retailer.totalOrders || 0)} tone="bg-blue-50 text-blue-500" />
                <StatCard icon={LuTrendingUp} label="Total purchase" value={taka(retailer.totalPurchase)} tone="bg-emerald-50 text-emerald-500" />
                <StatCard icon={LuWallet} label="Credit used" value={taka(used)} tone="bg-amber-50 text-amber-500" />
                <StatCard icon={LuWallet} label="Credit limit" value={taka(limit)} tone="bg-indigo-50 text-indigo-500" />
            </div>

            {/* Local dealer */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-sm font-bold text-gray-900">Your local dealer</h2>
                    <span className="text-[11px] font-semibold text-gray-400">
                        {nameOf(retailer.upazila) || 'Your upazila'}
                    </span>
                </div>

                {dealerLoading ? (
                    <div className="h-24 bg-gray-50 rounded-xl animate-pulse" />
                ) : !dealer ? (
                    <div className="text-center py-6">
                        <LuMapPin size={32} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-sm font-bold text-gray-600 mb-1">No dealer appointed yet</p>
                        <p className="text-xs text-gray-400">
                            Your upazila has no approved dealer at the moment. Orders will be handled centrally until one is appointed.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-lightest)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                            <LuUserRound size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{dealer.name}</p>
                            {dealer.address && <p className="text-xs text-gray-400 mt-0.5 truncate">{dealer.address}</p>}
                            {dealer.homeDelivery && (
                                <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                                    <LuTruck size={11} /> Delivers to your shop
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2 sm:shrink-0">
                            {dealer.phone && (
                                <a
                                    href={`tel:${dealer.phone}`}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold"
                                >
                                    <LuPhone size={15} /> Call
                                </a>
                            )}
                            {dealer.whatsapp && (
                                <a
                                    href={waLink(dealer.whatsapp)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50"
                                >
                                    <BsWhatsapp size={15} className="text-emerald-500" /> WhatsApp
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                    href="/dashboard/retailer/orders"
                    className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 transition-colors"
                >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><LuPackage size={18} /></div>
                    <span className="text-sm font-bold text-gray-800 flex-1">My orders</span>
                    <LuChevronRight size={16} className="text-gray-300" />
                </Link>
                <Link
                    href="/dashboard/retailer/profile"
                    className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 transition-colors"
                >
                    <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center"><LuStore size={18} /></div>
                    <span className="text-sm font-bold text-gray-800 flex-1">Shop profile</span>
                    <LuChevronRight size={16} className="text-gray-300" />
                </Link>
            </div>
        </div>
    );
}
