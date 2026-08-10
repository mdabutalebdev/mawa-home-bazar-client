"use client";

import React from 'react';
import Link from 'next/link';
import {
    LuPackage, LuShoppingBag, LuClock, LuCircleCheck, LuTruck,
    LuBadgeCheck, LuPercent, LuBuilding2, LuArrowRight, LuExternalLink,
    LuCircleAlert, LuBanknote,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetCompanyOrderStatsQuery, useGetMyCompanyQuery } from '@/redux/api/companyApi';

const taka = (n: number) => `৳${Number(n || 0).toLocaleString()}`;

interface Tile {
    label: string;
    value: string;
    icon: React.ElementType;
    tone: string;
    href?: string;
}

const TileCard = ({ tile }: { tile: Tile }) => {
    const body = (
        <>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tile.tone}`}>
                <tile.icon size={18} />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-none">{tile.value}</p>
            <p className="text-[12px] font-semibold text-gray-400 mt-1.5">{tile.label}</p>
        </>
    );

    const cls = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4 block transition-colors';

    return tile.href
        ? <Link href={tile.href} className={`${cls} hover:border-[rgba(var(--color-primary-rgb),0.35)]`}>{body}</Link>
        : <div className={cls}>{body}</div>;
};

const TileSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-gray-100 mb-3" />
        <div className="h-6 w-16 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
    </div>
);

export default function CompanyOverviewPage() {
    const { user } = useAppSelector((s) => s.auth);

    const { data: statsRes, isLoading: statsLoading, error: statsError } = useGetCompanyOrderStatsQuery(undefined);
    const { data: mineRes, isLoading: mineLoading } = useGetMyCompanyQuery(undefined);

    const stats = statsRes?.data || {};
    const company = mineRes?.data || null;

    const tiles: Tile[] = [
        { label: 'Products listed', value: String(stats.products ?? 0), icon: LuPackage, tone: 'bg-[rgba(var(--color-primary-rgb),0.09)] text-[var(--color-primary)]', href: '/dashboard/company/products' },
        { label: 'Total orders', value: String(stats.total ?? 0), icon: LuShoppingBag, tone: 'bg-gray-100 text-gray-600', href: '/dashboard/company/orders' },
        { label: 'Pending', value: String(stats.pending ?? 0), icon: LuClock, tone: 'bg-amber-50 text-amber-600', href: '/dashboard/company/orders?status=pending' },
        { label: 'Confirmed', value: String(stats.confirmed ?? 0), icon: LuCircleCheck, tone: 'bg-blue-50 text-blue-600', href: '/dashboard/company/orders?status=confirmed' },
        { label: 'Shipped', value: String(stats.shipped ?? 0), icon: LuTruck, tone: 'bg-indigo-50 text-indigo-600', href: '/dashboard/company/orders?status=shipped' },
        { label: 'Delivered', value: String(stats.delivered ?? 0), icon: LuBadgeCheck, tone: 'bg-emerald-50 text-emerald-600', href: '/dashboard/company/orders?status=delivered' },
        { label: 'Sales value', value: taka(stats.salesValue), icon: LuBanknote, tone: 'bg-teal-50 text-teal-600' },
    ];

    const approval = (() => {
        const s = company?.status;
        if (s === 'approved') return { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700', note: 'Your listings and orders are live.' };
        if (s === 'suspended') return { label: 'Suspended', cls: 'bg-red-50 text-red-700', note: 'Trading is paused. Contact support to restore your account.' };
        if (s === 'rejected') return { label: 'Rejected', cls: 'bg-red-50 text-red-700', note: company?.rejectionReason || 'Contact support if you think this is a mistake.' };
        return { label: 'Under review', cls: 'bg-amber-50 text-amber-700', note: 'The marketplace owner is checking your documents.' };
    })();

    return (
        <div className="space-y-4 sm:space-y-5">

            {/* ── Greeting ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Company panel</p>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1 truncate">
                            {company?.name || user?.name || 'Your company'}
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-1">
                            Your catalogue, your orders and your storefront — all in one place.
                        </p>
                    </div>
                    {company?.slug && company.status === 'approved' && (
                        <Link
                            href={`/companies/${company.slug}`}
                            className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl bg-gray-50 text-gray-700 text-[13px] font-bold hover:bg-gray-100 transition-colors flex-shrink-0"
                        >
                            <LuExternalLink size={15} /> View storefront
                        </Link>
                    )}
                </div>
            </div>

            {/* ── Approval + commission ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <LuBuilding2 size={15} className="text-gray-400" />
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Approval status</p>
                    </div>
                    {mineLoading ? (
                        <div className="h-7 w-28 bg-gray-100 rounded-lg animate-pulse" />
                    ) : (
                        <>
                            <span className={`inline-block px-3 py-1.5 rounded-lg text-[13px] font-extrabold ${approval.cls}`}>
                                {approval.label}
                            </span>
                            <p className="text-[12px] text-gray-500 leading-relaxed mt-2">{approval.note}</p>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <LuPercent size={15} className="text-gray-400" />
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Commission rate</p>
                    </div>
                    {statsLoading ? (
                        <div className="h-7 w-20 bg-gray-100 rounded-lg animate-pulse" />
                    ) : (
                        <>
                            <p className="text-2xl font-extrabold text-gray-900 leading-none">
                                {Number(stats.commissionRate ?? 0)}%
                            </p>
                            <p className="text-[12px] text-gray-500 leading-relaxed mt-2">
                                The marketplace owner&apos;s cut of your sales. Only the owner can change it.
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* ── Tiles ── */}
            <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 px-0.5">
                    At a glance
                </h2>
                {statsLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {[...Array(7)].map((_, i) => <TileSkeleton key={i} />)}
                    </div>
                ) : statsError ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                        <LuCircleAlert size={32} className="mx-auto text-amber-400 mb-3" />
                        <p className="text-sm font-bold text-gray-700">Your figures are not available yet</p>
                        <p className="text-[13px] text-gray-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                            {(statsError as { data?: { message?: string } })?.data?.message
                                || 'This usually means your company is still waiting for approval.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {tiles.map((t) => <TileCard key={t.label} tile={t} />)}
                    </div>
                )}
            </div>

            {/* ── Shortcuts ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Link
                    href="/dashboard/company/products"
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors"
                >
                    <div className="w-11 h-11 rounded-xl bg-[rgba(var(--color-primary-rgb),0.09)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                        <LuPackage size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-gray-900">Add a product</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Post it, and it goes live once approved.</p>
                    </div>
                    <LuArrowRight size={16} className="text-gray-300 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0" />
                </Link>

                <Link
                    href="/dashboard/company/orders"
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors"
                >
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <LuShoppingBag size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-gray-900">Work your orders</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Ship once the dealer has confirmed by phone.</p>
                    </div>
                    <LuArrowRight size={16} className="text-gray-300 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0" />
                </Link>
            </div>
        </div>
    );
}
