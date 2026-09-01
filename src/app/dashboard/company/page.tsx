"use client";

import React from 'react';
import Link from 'next/link';
import {
    LuPackage, LuShoppingCart, LuBadgeCheck, LuBanknote, LuArrowRight,
    LuExternalLink, LuCircleAlert, LuPlus, LuChevronRight, LuBox,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import {
    useGetCompanyOrderStatsQuery,
    useGetMyCompanyQuery,
    useGetCompanyOrdersQuery,
} from '@/redux/api/companyApi';

const taka = (n: unknown) => `৳${Number(n || 0).toLocaleString()}`;

// ── Design tokens ─────────────────────────────────────────────
// A muted, restrained palette. Only DATA carries meaning here — no
// decorative jewel-tone gradients. Neutral surfaces, brand accent used
// sparingly, status pills only where a status exists.
const CARD = 'rounded-xl border border-gray-200/80 bg-white';

// Order-status pills — a single tone per status, no ring, no gradient.
const STATUS_TONE: Record<string, { chip: string; dot: string }> = {
    pending:   { chip: 'bg-amber-50 text-amber-700',       dot: 'bg-amber-400' },
    confirmed: { chip: 'bg-sky-50 text-sky-700',           dot: 'bg-sky-400' },
    processing:{ chip: 'bg-sky-50 text-sky-700',           dot: 'bg-sky-400' },
    shipped:   { chip: 'bg-indigo-50 text-indigo-700',     dot: 'bg-indigo-400' },
    delivered: { chip: 'bg-emerald-50 text-emerald-700',   dot: 'bg-emerald-500' },
    cancelled: { chip: 'bg-gray-100 text-gray-500',        dot: 'bg-gray-300' },
};

const statusTone = (s: string) => STATUS_TONE[s] || { chip: 'bg-gray-100 text-gray-600', dot: 'bg-gray-300' };

// Approval banner tone — only one that is allowed to shout, since it blocks trading.
const APPROVAL_TONE: Record<string, string> = {
    approved:  'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
    pending:   'bg-amber-50 text-amber-700 ring-amber-200/70',
    suspended: 'bg-red-50 text-red-700 ring-red-200/70',
    rejected:  'bg-red-50 text-red-700 ring-red-200/70',
};

export default function CompanyOverviewPage() {
    const { user } = useAppSelector((s) => s.auth);
    const { data: statsRes, isLoading, error: statsError } = useGetCompanyOrderStatsQuery(undefined);
    const { data: mineRes, isLoading: mineLoading } = useGetMyCompanyQuery(undefined);
    const { data: ordersRes } = useGetCompanyOrdersQuery({ limit: 6 });

    const stats = statsRes?.data || {};
    const company = mineRes?.data || null;
    const recentOrders: any[] = ordersRes?.data?.orders || [];

    const status = company?.status || 'pending';
    const approvalLabel =
        status === 'approved' ? 'Approved' :
        status === 'suspended' ? 'Suspended' :
        status === 'rejected' ? 'Rejected' : 'Under review';

    // KPIs — same 4 numbers, but restrained styling: a small monotone icon,
    // one large number and a small caption. No jewel colors.
    const kpis = [
        {
            key: 'sales',
            label: 'Total sales',
            value: taka(stats.salesValue),
            caption: 'Revenue from your goods',
            icon: LuBanknote,
        },
        {
            key: 'orders',
            label: 'Total orders',
            value: String(stats.total ?? 0),
            caption: `${stats.pending ?? 0} pending confirmation`,
            icon: LuShoppingCart,
            href: '/dashboard/company/orders',
        },
        {
            key: 'products',
            label: 'Products listed',
            value: String(stats.products ?? 0),
            caption: 'In your catalogue',
            icon: LuPackage,
            href: '/dashboard/company/products',
        },
        {
            key: 'delivered',
            label: 'Delivered',
            value: String(stats.delivered ?? 0),
            caption: 'Completed orders',
            icon: LuBadgeCheck,
        },
    ];

    const pipeline = [
        { key: 'pending',    label: 'Pending',    value: stats.pending ?? 0 },
        { key: 'confirmed',  label: 'Confirmed',  value: stats.confirmed ?? 0 },
        { key: 'shipped',    label: 'Shipped',    value: stats.shipped ?? 0 },
        { key: 'delivered',  label: 'Delivered',  value: stats.delivered ?? 0 },
    ];

    const pipelineTotal = pipeline.reduce((n, p) => n + Number(p.value || 0), 0);

    return (
        <div className="space-y-6">

            {/* ── Page header ────────────────────────────────────────── */}
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-400 tracking-wide">COMPANY PANEL</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 truncate">
                        {company?.name || user?.name || 'Your company'}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your catalogue, orders and storefront from a single place.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {!mineLoading && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${APPROVAL_TONE[status] || APPROVAL_TONE.pending}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status === 'approved' ? 'bg-emerald-500' : status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                            {approvalLabel}
                        </span>
                    )}
                    {company?.slug && status === 'approved' && (
                        <Link
                            href={`/companies/${company.slug}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <LuExternalLink size={13} /> View storefront
                        </Link>
                    )}
                </div>
            </header>

            {/* ── KPI grid ───────────────────────────────────────────── */}
            {statsError ? (
                <div className={`${CARD} p-6 text-center`}>
                    <LuCircleAlert size={28} className="mx-auto text-amber-400 mb-3" />
                    <p className="text-sm font-semibold text-gray-800">Your figures are not available yet</p>
                    <p className="mt-1.5 max-w-md mx-auto text-[13px] text-gray-500 leading-relaxed">
                        {(statsError as { data?: { message?: string } })?.data?.message
                            || 'This usually means your company is still waiting for approval.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((k) => {
                        const body = (
                            <div className={`${CARD} p-5 h-full`}>
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                                        <k.icon size={18} />
                                    </span>
                                    {k.href && (
                                        <LuArrowRight size={14} className="text-gray-300" />
                                    )}
                                </div>
                                {isLoading ? (
                                    <div className="mt-4 h-7 w-20 rounded-md bg-gray-100 animate-pulse" />
                                ) : (
                                    <p className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">{k.value}</p>
                                )}
                                <p className="mt-1 text-[13px] font-medium text-gray-700">{k.label}</p>
                                <p className="mt-0.5 text-[11px] text-gray-400">{k.caption}</p>
                            </div>
                        );
                        return k.href
                            ? <Link key={k.key} href={k.href} className="block transition-colors hover:[&>div]:border-gray-300">{body}</Link>
                            : <div key={k.key}>{body}</div>;
                    })}
                </div>
            )}

            {/* ── Two-column: order pipeline + quick actions ─────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Order pipeline */}
                {!statsError && (
                    <div className={`${CARD} lg:col-span-2 p-5`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Order pipeline</h2>
                                <p className="text-[12px] text-gray-500 mt-0.5">
                                    {pipelineTotal > 0 ? `${pipelineTotal} orders across all stages` : 'No orders yet — they show up here as they arrive.'}
                                </p>
                            </div>
                            <Link href="/dashboard/company/orders" className="text-[12px] font-semibold text-[var(--color-primary)] hover:underline">
                                Manage →
                            </Link>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {pipeline.map((p) => {
                                const tone = statusTone(p.key);
                                return (
                                    <Link
                                        key={p.key}
                                        href={`/dashboard/company/orders?status=${p.key}`}
                                        className={`flex flex-col items-start justify-between rounded-lg border border-gray-200/70 bg-white px-3 py-3 min-h-[74px] transition-colors hover:border-gray-300`}
                                    >
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.chip}`}>
                                            <span className={`h-1 w-1 rounded-full ${tone.dot}`} />
                                            {p.label}
                                        </span>
                                        <span className="mt-2 text-xl font-semibold text-gray-900 leading-none">{p.value}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Quick actions */}
                <div className={`${CARD} p-5`}>
                    <h2 className="text-sm font-semibold text-gray-900">Quick actions</h2>
                    <p className="text-[12px] text-gray-500 mt-0.5">Common tasks, one click away.</p>
                    <div className="mt-3 space-y-2">
                        <Link
                            href="/dashboard/company/products"
                            className="group flex items-center gap-3 rounded-lg border border-gray-200/70 bg-white p-3 hover:border-gray-300 transition-colors"
                        >
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(var(--color-primary-rgb),0.08)] text-[var(--color-primary)]">
                                <LuPlus size={16} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-900">Add a product</p>
                                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Goes live once the owner approves it.</p>
                            </div>
                            <LuChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </Link>
                        <Link
                            href="/dashboard/company/orders?status=pending"
                            className="group flex items-center gap-3 rounded-lg border border-gray-200/70 bg-white p-3 hover:border-gray-300 transition-colors"
                        >
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                <LuBox size={16} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-900">Confirm pending orders</p>
                                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                                    {stats.pending ?? 0} waiting on you.
                                </p>
                            </div>
                            <LuChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Recent orders ──────────────────────────────────────── */}
            <div className={`${CARD}`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Recent orders</h2>
                        <p className="text-[12px] text-gray-500 mt-0.5">Latest orders that include your products.</p>
                    </div>
                    <Link href="/dashboard/company/orders" className="text-[12px] font-semibold text-[var(--color-primary)] hover:underline">
                        View all →
                    </Link>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                            <LuShoppingCart size={20} className="text-gray-400" />
                        </div>
                        <p className="text-[13px] font-semibold text-gray-700">No orders yet</p>
                        <p className="mt-1 text-[12px] text-gray-500">
                            Once a customer buys one of your products, it will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                    <th className="font-semibold px-5 py-2.5">Order</th>
                                    <th className="font-semibold px-3 py-2.5 hidden sm:table-cell">Date</th>
                                    <th className="font-semibold px-3 py-2.5">Items</th>
                                    <th className="font-semibold px-3 py-2.5 text-right">Your share</th>
                                    <th className="font-semibold px-5 py-2.5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentOrders.map((o: any) => {
                                    const tone = statusTone(o.status);
                                    const orderId = o.orderId || o._id?.slice(-8).toUpperCase();
                                    return (
                                        <tr key={o._id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-3">
                                                <Link
                                                    href={`/dashboard/company/orders?highlight=${o._id}`}
                                                    className="text-[13px] font-semibold text-gray-900 hover:text-[var(--color-primary)]"
                                                >
                                                    #{orderId}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3 text-[12px] text-gray-500 whitespace-nowrap hidden sm:table-cell">
                                                {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                            </td>
                                            <td className="px-3 py-3 text-[12px] text-gray-600">
                                                {(o.myItemCount ?? o.items?.length ?? 0)} item{(o.myItemCount ?? o.items?.length ?? 0) === 1 ? '' : 's'}
                                            </td>
                                            <td className="px-3 py-3 text-[13px] font-semibold text-gray-900 text-right whitespace-nowrap">
                                                {taka(o.mySubtotal ?? o.total)}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.chip}`}>
                                                    <span className={`h-1 w-1 rounded-full ${tone.dot}`} />
                                                    {o.status || 'pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
