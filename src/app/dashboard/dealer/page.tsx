"use client";

import React from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    LuShoppingCart,
    LuPhoneCall,
    LuCircleCheck,
    LuWallet,
    LuHandCoins,
    LuStore,
    LuMapPin,
    LuPercent,
    LuBike,
    LuChevronRight,
    LuShieldCheck,
    LuTriangleAlert,
    LuArrowRight,
    LuInbox,
    LuTruck,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import {
    useGetDealerOrderStatsQuery,
    useGetMyDealerQuery,
    useGetDealerOrdersQuery,
    useUpdateMyDealerMutation,
} from '@/redux/api/dealerApi';

const money = (n: number | string) => `৳${Number(n || 0).toLocaleString()}`;

// ── Shared card look ──────────────────────────────────────────
const CARD = 'rounded-2xl border border-gray-200/70 bg-white shadow-sm';

// Status → pill classes (matches admin dashboard's palette).
const STATUS_PILL: Record<string, string> = {
    pending:    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70',
    confirmed:  'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    processing: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/70',
    shipped:    'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/70',
    delivered:  'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70',
    cancelled:  'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70',
};
const pillCls = (s: string) => STATUS_PILL[s] || 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200';

const RoleGate = () => (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
            <LuShieldCheck size={26} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Dealers only</h1>
        <p className="text-sm text-gray-500 mt-2">Apply for your upazila to open this dashboard.</p>
        <Link
            href="/join/dealer"
            className="mt-5 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-all"
        >
            Become a dealer <LuChevronRight size={16} />
        </Link>
    </div>
);

export default function DealerOverviewPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user?.role || '') as string;
    const isDealer = isAuthenticated && role === 'dealer';

    const { data: statsRes, isLoading: statsLoading, error: statsError } = useGetDealerOrderStatsQuery(undefined, { skip: !isDealer });
    const { data: dealerRes, isLoading: dealerLoading } = useGetMyDealerQuery(undefined, { skip: !isDealer });
    const { data: ordersRes } = useGetDealerOrdersQuery({ limit: 6 }, { skip: !isDealer });
    const [updateDealer, { isLoading: toggling }] = useUpdateMyDealerMutation();

    if (!isDealer) return <RoleGate />;

    const stats = statsRes?.data || {};
    const dealer = dealerRes?.data || {};
    const territory = dealer?.upazila?.name || dealer?.upazila?.bnName || '—';
    const district = dealer?.district?.name || '';
    const commissionRate = stats?.commissionRate ?? dealer?.commissionRate ?? 0;
    const homeDelivery = dealer?.homeDelivery ?? stats?.homeDelivery ?? false;
    const isLoading = statsLoading || dealerLoading;
    const recentOrders: any[] = ordersRes?.data?.orders || [];

    // 403 here means the application is still pending / suspended — the order
    // endpoints refuse to answer until the owner approves the territory.
    const blocked = (statsError as any)?.status === 403 || (statsError as any)?.status === 404;
    const blockedMessage = (statsError as any)?.data?.message || 'Your dealer account is not approved yet.';

    // ── Jewel-tone KPI cards (admin-style: solid color, white text) ──
    // Each card owns its own colour so a dealer can glance at the strip and
    // instantly know which number is which; the semantic mapping stays fixed.
    const kpis = [
        {
            key: 'orders',
            label: 'Total orders',
            value: (stats.total || 0).toLocaleString(),
            sub: `${stats.pending || 0} pending`,
            icon: LuShoppingCart,
            color: '#2563EB',
            href: '/dashboard/dealer/orders',
        },
        {
            key: 'awaiting',
            label: 'Awaiting my call',
            value: (stats.awaitingConfirmation || 0).toLocaleString(),
            sub: 'Confirm to unblock ship',
            icon: LuPhoneCall,
            color: '#D97706',
            href: '/dashboard/dealer/orders?confirmed=false',
        },
        {
            key: 'delivered',
            label: 'Delivered',
            value: (stats.delivered || 0).toLocaleString(),
            sub: 'Completed orders',
            icon: LuCircleCheck,
            color: '#059669',
            href: '/dashboard/dealer/orders?status=delivered',
        },
        {
            key: 'sales',
            label: 'Sales value',
            value: money(stats.salesValue || 0),
            sub: 'Total order value in your area',
            icon: LuWallet,
            color: '#0D9488',
        },
        {
            key: 'commission',
            label: 'My commission',
            value: money(stats.commission || 0),
            sub: `${commissionRate}% commission rate`,
            icon: LuHandCoins,
            color: '#7C3AED',
        },
        {
            key: 'shops',
            label: 'Shops in my area',
            value: (stats.retailers || 0).toLocaleString(),
            sub: 'Approved retailers',
            icon: LuStore,
            color: '#DB2777',
            href: '/dashboard/dealer/retailers',
        },
    ];

    // Inline home-delivery switch — dealer's key operational lever, so it lives
    // on the overview instead of buried in profile.
    const toggleHomeDelivery = async () => {
        const next = !homeDelivery;
        try {
            await updateDealer({ homeDelivery: next }).unwrap();
            toast.success(next ? 'Home delivery turned ON' : 'Home delivery turned OFF');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not update home delivery');
        }
    };

    return (
        <div className="space-y-5">

            {/* ── Header ───────────────────────────────────────────── */}
            <div className={`${CARD} p-5 sm:p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-primary)]">Dealer panel</p>
                        <h1 className="mt-1 text-2xl font-bold text-gray-900 truncate">
                            Hello, {user?.name?.split(' ')[0] || 'Dealer'}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Everything happening in your upazila, in one place.
                        </p>
                    </div>
                </div>
            </div>

            {blocked && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                    <LuTriangleAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Not trading yet</p>
                        <p className="text-xs text-amber-700 mt-0.5">{blockedMessage}</p>
                    </div>
                </div>
            )}

            {/* ── Territory strip ──────────────────────────────────── */}
            <div className={`${CARD} p-5`}>
                {dealerLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:divide-x divide-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                                <LuMapPin size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">My territory</p>
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {territory}{district ? `, ${district}` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:pl-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <LuPercent size={18} />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Commission rate</p>
                                <p className="text-sm font-bold text-gray-900">{commissionRate}%</p>
                            </div>
                        </div>

                        {/* Home delivery: read AND write here so the dealer flips it in one click. */}
                        <div className="flex items-center gap-3 sm:pl-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${homeDelivery ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                <LuBike size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Home delivery</p>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold ${homeDelivery ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${homeDelivery ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                        {homeDelivery ? 'ON' : 'OFF'}
                                    </span>
                                    <button
                                        onClick={toggleHomeDelivery}
                                        disabled={toggling}
                                        className={`relative w-9 h-5 rounded-full p-0.5 shrink-0 transition-all disabled:opacity-60 ${homeDelivery ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                        aria-label="Toggle home delivery"
                                    >
                                        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${homeDelivery ? 'translate-x-4' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Jewel-tone KPI grid ──────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {isLoading
                    ? [...Array(6)].map((_, i) => (
                        <div key={i} className="rounded-2xl p-4 sm:p-5 shadow-sm animate-pulse bg-gray-100 h-[124px]" />
                    ))
                    : kpis.map((k) => {
                        const Icon = k.icon;
                        const body = (
                            <>
                                <div className="flex items-start justify-between">
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white ring-1 ring-inset ring-white/25">
                                        <Icon size={18} />
                                    </span>
                                    {k.href && <LuArrowRight size={15} className="text-white/60" />}
                                </div>
                                <p className="mt-3 text-2xl font-bold leading-none tracking-tight text-white">{k.value}</p>
                                <p className="mt-2 text-[13px] font-semibold text-white/90">{k.label}</p>
                                <p className="mt-0.5 text-[11px] font-medium text-white/75">{k.sub}</p>
                            </>
                        );
                        const cls = 'rounded-2xl p-4 sm:p-5 shadow-sm transition-transform hover:-translate-y-0.5 block';
                        return k.href
                            ? <Link key={k.key} href={k.href} className={cls} style={{ background: k.color }}>{body}</Link>
                            : <div key={k.key} className={cls} style={{ background: k.color }}>{body}</div>;
                    })}
            </div>

            {/* ── Priority CTA row: confirmation queue + order requests ─ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    href="/dashboard/dealer/orders?confirmed=false"
                    className={`${CARD} group flex items-center gap-3 p-4 sm:p-5 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors`}
                >
                    <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                        <LuPhoneCall size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-gray-900">Orders waiting for my call</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            Phone the customer and the company — the company can only ship after that.
                        </p>
                    </div>
                    <LuChevronRight size={18} className="text-gray-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all shrink-0" />
                </Link>

                <Link
                    href="/dashboard/dealer/order-requests"
                    className={`${CARD} group flex items-center gap-3 p-4 sm:p-5 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors`}
                >
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <LuInbox size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-gray-900">New order requests</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            Retailers asking you to arrange goods on their behalf.
                        </p>
                    </div>
                    <LuChevronRight size={18} className="text-gray-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
            </div>

            {/* ── Recent orders in this upazila ────────────────────── */}
            <div className={`${CARD}`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Recent orders</h2>
                        <p className="text-[12px] text-gray-500 mt-0.5">Latest orders placed in your upazila.</p>
                    </div>
                    <Link href="/dashboard/dealer/orders" className="text-[12px] font-semibold text-[var(--color-primary)] hover:underline">
                        View all →
                    </Link>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                            <LuTruck size={20} className="text-gray-400" />
                        </div>
                        <p className="text-[13px] font-semibold text-gray-700">No orders yet</p>
                        <p className="mt-1 text-[12px] text-gray-500">
                            Orders placed in <span className="font-semibold">{territory}</span> will show up here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                    <th className="font-semibold px-5 py-2.5">Order</th>
                                    <th className="font-semibold px-3 py-2.5 hidden sm:table-cell">Date</th>
                                    <th className="font-semibold px-3 py-2.5 hidden md:table-cell">Customer</th>
                                    <th className="font-semibold px-3 py-2.5 text-right">Total</th>
                                    <th className="font-semibold px-5 py-2.5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentOrders.map((o: any) => {
                                    const orderId = o.orderId || o._id?.slice(-8).toUpperCase();
                                    const customer = o.shippingAddress?.fullName
                                        || o.customer?.name
                                        || o.user?.name
                                        || '—';
                                    return (
                                        <tr key={o._id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-3">
                                                <Link
                                                    href={`/dashboard/dealer/orders?highlight=${o._id}`}
                                                    className="text-[13px] font-semibold text-gray-900 hover:text-[var(--color-primary)]"
                                                >
                                                    #{orderId}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3 text-[12px] text-gray-500 whitespace-nowrap hidden sm:table-cell">
                                                {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                            </td>
                                            <td className="px-3 py-3 text-[12px] text-gray-600 truncate max-w-[160px] hidden md:table-cell">
                                                {customer}
                                            </td>
                                            <td className="px-3 py-3 text-[13px] font-semibold text-gray-900 text-right whitespace-nowrap">
                                                {money(o.total)}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${pillCls(o.status)}`}>
                                                    {(o.status || 'pending').replace(/_/g, ' ')}
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
