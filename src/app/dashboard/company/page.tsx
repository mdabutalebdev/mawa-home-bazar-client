"use client";

import React from 'react';
import Link from 'next/link';
import {
    LuPackage, LuShoppingCart, LuBadgeCheck, LuBanknote, LuPercent,
    LuArrowRight, LuExternalLink, LuCircleAlert, LuPlus, LuShoppingBag, LuBuilding2,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetCompanyOrderStatsQuery, useGetMyCompanyQuery } from '@/redux/api/companyApi';

const taka = (n: unknown) => `৳${Number(n || 0).toLocaleString()}`;

// One card look, matching the admin panel.
const CARD = 'rounded-2xl border border-gray-200/70 bg-white shadow-sm';

// Status → pill classes (subtle inset ring), same source of truth as admin.
const PILL: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70',
    confirmed: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    shipped: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/70',
    delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70',
};

export default function CompanyOverviewPage() {
    const { user } = useAppSelector((s) => s.auth);
    const { data: statsRes, isLoading, error: statsError } = useGetCompanyOrderStatsQuery(undefined);
    const { data: mineRes, isLoading: mineLoading } = useGetMyCompanyQuery(undefined);

    const stats = statsRes?.data || {};
    const company = mineRes?.data || null;

    // ── Colored KPI cards (jewel tones, white text) ──
    const kpis = [
        { label: 'Sales value', value: taka(stats.salesValue), sub: 'From your goods', icon: LuBanknote, color: '#059669' },
        { label: 'Total orders', value: String(stats.total ?? 0), sub: `${stats.pending ?? 0} pending`, icon: LuShoppingCart, color: '#2563EB', href: '/dashboard/company/orders' },
        { label: 'Products listed', value: String(stats.products ?? 0), sub: 'In your catalogue', icon: LuPackage, color: '#7C3AED', href: '/dashboard/company/products' },
        { label: 'Delivered', value: String(stats.delivered ?? 0), sub: 'Completed orders', icon: LuBadgeCheck, color: '#0D9488' },
    ];

    const pipeline = [
        { key: 'pending', label: 'Pending', value: stats.pending ?? 0 },
        { key: 'confirmed', label: 'Confirmed', value: stats.confirmed ?? 0 },
        { key: 'shipped', label: 'Shipped', value: stats.shipped ?? 0 },
        { key: 'delivered', label: 'Delivered', value: stats.delivered ?? 0 },
    ];

    const approval = (() => {
        const s = company?.status;
        if (s === 'approved') return { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70', note: 'Your listings and orders are live.' };
        if (s === 'suspended') return { label: 'Suspended', cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70', note: 'Trading is paused. Contact support to restore your account.' };
        if (s === 'rejected') return { label: 'Rejected', cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70', note: company?.rejectionReason || 'Contact support if you think this is a mistake.' };
        return { label: 'Under review', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70', note: 'The marketplace owner is checking your documents.' };
    })();

    return (
        <div className="space-y-5">

            {/* ── Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-primary)]">Company panel</p>
                    <h1 className="text-[22px] sm:text-2xl font-bold tracking-tight text-gray-900 mt-0.5 truncate">
                        {company?.name || user?.name || 'Your company'}
                    </h1>
                    <p className="mt-1 text-[13px] text-gray-500">Your catalogue, your orders and your storefront — all in one place.</p>
                </div>
                {company?.slug && company.status === 'approved' && (
                    <Link
                        href={`/companies/${company.slug}`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        <LuExternalLink size={14} /> <span className="hidden sm:inline">View storefront</span>
                    </Link>
                )}
            </div>

            {/* ── KPI grid ── */}
            {statsError ? (
                <div className={`${CARD} p-6 text-center`}>
                    <LuCircleAlert size={32} className="mx-auto text-amber-400 mb-3" />
                    <p className="text-sm font-bold text-gray-700">Your figures are not available yet</p>
                    <p className="text-[13px] text-gray-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                        {(statsError as { data?: { message?: string } })?.data?.message
                            || 'This usually means your company is still waiting for approval.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((k, i) => {
                        const inner = (
                            <>
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white ring-1 ring-inset ring-white/25">
                                    <k.icon size={18} />
                                </span>
                                {isLoading ? (
                                    <div className="mt-4 h-7 w-24 animate-pulse rounded-md bg-white/25" />
                                ) : (
                                    <p className="mt-4 text-[26px] font-bold leading-none tracking-tight text-white">{k.value}</p>
                                )}
                                <p className="mt-2 text-[13px] font-semibold text-white/90">{k.label}</p>
                                <p className="mt-0.5 text-[11px] font-medium text-white/75">{k.sub}</p>
                            </>
                        );
                        const cls = 'rounded-2xl p-4 sm:p-5 shadow-sm block transition-transform hover:-translate-y-0.5';
                        return k.href
                            ? <Link key={i} href={k.href} className={cls} style={{ background: k.color }}>{inner}</Link>
                            : <div key={i} className={cls} style={{ background: k.color }}>{inner}</div>;
                    })}
                </div>
            )}

            {/* ── Order pipeline ── */}
            {!statsError && (
                <div className={`${CARD} p-4 sm:p-5`}>
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-[15px] font-semibold text-gray-900">Order pipeline</h3>
                        <Link href="/dashboard/company/orders" className="text-[12px] font-semibold text-[var(--color-primary)] hover:underline">Manage</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {pipeline.map((p) => (
                            <Link
                                key={p.key}
                                href={`/dashboard/company/orders?status=${p.key}`}
                                className={`flex flex-col items-center justify-center rounded-xl px-2 py-3 text-center transition-transform hover:-translate-y-0.5 ${PILL[p.key]}`}
                            >
                                <span className="text-xl font-bold leading-none">{p.value}</span>
                                <span className="mt-1 text-[11px] font-semibold">{p.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Approval + commission ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`${CARD} p-4 sm:p-5`}>
                    <div className="flex items-center gap-2 mb-2.5">
                        <LuBuilding2 size={15} className="text-gray-400" />
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Approval status</p>
                    </div>
                    {mineLoading ? (
                        <div className="h-7 w-28 bg-gray-100 rounded-lg animate-pulse" />
                    ) : (
                        <>
                            <span className={`inline-block px-3 py-1.5 rounded-lg text-[13px] font-extrabold ${approval.cls}`}>{approval.label}</span>
                            <p className="text-[12px] text-gray-500 leading-relaxed mt-2.5">{approval.note}</p>
                        </>
                    )}
                </div>

                <div className={`${CARD} p-4 sm:p-5`}>
                    <div className="flex items-center gap-2 mb-2.5">
                        <LuPercent size={15} className="text-gray-400" />
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Commission rate</p>
                    </div>
                    {isLoading ? (
                        <div className="h-7 w-20 bg-gray-100 rounded-lg animate-pulse" />
                    ) : (
                        <>
                            <p className="text-2xl font-extrabold text-gray-900 leading-none">{Number(stats.commissionRate ?? 0)}%</p>
                            <p className="text-[12px] text-gray-500 leading-relaxed mt-2.5">The marketplace owner&apos;s cut of your sales. Only the owner can change it.</p>
                        </>
                    )}
                </div>
            </div>

            {/* ── Quick actions ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/dashboard/company/products" className={`group ${CARD} p-4 sm:p-5 flex items-center gap-3 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors`}>
                    <div className="w-11 h-11 rounded-xl bg-[rgba(var(--color-primary-rgb),0.09)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                        <LuPlus size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-gray-900">Add a product</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Post it, and it goes live once approved.</p>
                    </div>
                    <LuArrowRight size={16} className="text-gray-300 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0" />
                </Link>

                <Link href="/dashboard/company/orders" className={`group ${CARD} p-4 sm:p-5 flex items-center gap-3 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors`}>
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
