"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuHistory,
    LuCircleCheckBig,
    LuCircleX,
    LuUndo2,
    LuBanknote,
    LuShieldCheck,
    LuChevronRight,
    LuTriangleAlert,
    LuUserRound,
    LuMapPin,
    LuPackage,
    LuRefreshCw,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetMyAssignmentsQuery } from '@/redux/api/deliveryApi';

/* ─── Types ─── */
interface ShippingAddress {
    fullName?: string;
    address?: string;
    area?: string;
    city?: string;
    postalCode?: string;
}

interface OrderLite {
    _id?: string;
    orderId?: string;
    total?: number;
    shippingAddress?: ShippingAddress;
}

interface Assignment {
    _id: string;
    order?: OrderLite | null;
    status: string;
    assignedAt?: string;
    deliveredAt?: string | null;
    updatedAt?: string;
    codAmount?: number;
    codCollected?: boolean;
    proofPhoto?: string;
    recipientName?: string;
    failureReason?: string;
}

/* ─── Constants ─── */

/** A delivery is history once it can no longer move. */
const CLOSED_STATUSES = ['delivered', 'failed', 'returned'];

const OUTCOME: Record<string, { label: string; tone: string; icon: React.ElementType }> = {
    delivered: { label: 'Delivered', tone: 'bg-emerald-50 text-emerald-700', icon: LuCircleCheckBig },
    failed: { label: 'Failed', tone: 'bg-red-50 text-red-700', icon: LuCircleX },
    returned: { label: 'Returned', tone: 'bg-gray-100 text-gray-600', icon: LuUndo2 },
};

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'failed', label: 'Failed' },
    { id: 'returned', label: 'Returned' },
];

/* ─── Helpers ─── */
const TK = (n?: number) => `৳${Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

const errorMessage = (err: unknown, fallback: string) =>
    (err as { data?: { message?: string } } | null)?.data?.message || fallback;

const dateLabel = (iso?: string | null) =>
    iso
        ? new Date(iso).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })
        : '—';

const fullAddress = (a?: ShippingAddress) =>
    [a?.address, a?.area, a?.city, a?.postalCode].filter(Boolean).join(', ');

/** When it actually closed: delivered stamps a time, the rest only touch updatedAt. */
const closedAt = (a: Assignment) => a.deliveredAt || a.updatedAt || a.assignedAt;

/* ─── Page ─── */
export default function RiderHistoryPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user as { role?: string } | null)?.role;
    const allowed = isAuthenticated && role === 'delivery_man';

    const [tab, setTab] = useState('all');

    const { data: res, isLoading, isFetching, error, refetch } = useGetMyAssignmentsQuery(undefined, {
        skip: !allowed,
    });

    if (!allowed) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                    <LuShieldCheck size={26} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-2">Delivery riders only</h1>
                <p className="text-sm text-gray-500 mb-6">
                    Your delivery history appears here once you ride for a dealer.
                </p>
                <Link
                    href="/join"
                    className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] px-5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                    Join as a rider <LuChevronRight size={16} />
                </Link>
            </div>
        );
    }

    const assignments: Assignment[] = Array.isArray(res?.data) ? (res?.data as Assignment[]) : [];
    const past = assignments.filter((a) => CLOSED_STATUSES.includes(a.status));

    const deliveredCount = past.filter((a) => a.status === 'delivered').length;
    const failedCount = past.filter((a) => a.status === 'failed').length;
    const codCollected = past.reduce(
        (sum, a) => sum + (a.codCollected ? Number(a.codAmount || 0) : 0),
        0,
    );

    const rows = tab === 'all' ? past : past.filter((a) => a.status === tab);
    // '' when the query is fine — the banner below is hidden on a falsy value.
    const blockedMessage = errorMessage(error, '');

    return (
        <div className="space-y-4">
            {/* ── Totals ── */}
            <div
                className="rounded-2xl p-5 text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), #ff8c5a)' }}
            >
                <p className="text-xs opacity-80 flex items-center gap-1.5">
                    <LuHistory size={14} /> Everything you have carried
                </p>
                <p className="text-3xl font-extrabold mt-1">{deliveredCount}</p>
                <p className="text-xs opacity-80">deliveries handed over</p>

                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/20">
                    {[
                        ['COD collected', TK(codCollected)],
                        ['Failed', String(failedCount)],
                        ['Total jobs', String(past.length)],
                    ].map(([k, v]) => (
                        <div key={k}>
                            <p className="text-[10px] uppercase tracking-wide opacity-70">{k}</p>
                            <p className="text-sm font-bold truncate">{v}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Filter ── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`min-h-[44px] px-4 rounded-xl text-[13px] font-bold whitespace-nowrap transition-colors ${
                            tab === t.id
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
                <button
                    onClick={() => refetch()}
                    aria-label="Refresh history"
                    className="ml-auto w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                    <LuRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
                </button>
            </div>

            {blockedMessage && !isLoading && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <LuTriangleAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Cannot load your history</p>
                        <p className="text-xs text-amber-700 mt-0.5">{blockedMessage}</p>
                    </div>
                </div>
            )}

            {/* ── List ── */}
            {isLoading ? (
                <div className="space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-pulse space-y-3">
                            <div className="flex justify-between">
                                <div className="h-4 w-28 bg-gray-200 rounded" />
                                <div className="h-6 w-20 bg-gray-200 rounded" />
                            </div>
                            <div className="h-10 bg-gray-100 rounded-xl" />
                        </div>
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
                    <LuPackage size={44} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-base font-bold text-gray-600 mb-1">
                        {past.length === 0 ? 'No finished deliveries yet' : 'Nothing with this outcome'}
                    </h3>
                    <p className="text-sm text-gray-400">
                        {past.length === 0
                            ? 'Every parcel you close will be listed here with its outcome.'
                            : 'Try another filter to see the rest of your history.'}
                    </p>
                    {past.length === 0 && (
                        <Link
                            href="/dashboard/rider"
                            className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)]"
                        >
                            Back to today&apos;s jobs <LuChevronRight size={15} />
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {rows.map((a) => {
                        const cfg = OUTCOME[a.status] || OUTCOME.returned;
                        const Icon = cfg.icon;
                        const order = a.order || undefined;
                        const ship = order?.shippingAddress;
                        const address = fullAddress(ship);
                        const cod = Number(a.codAmount || 0);

                        return (
                            <div key={a._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[var(--color-primary)] truncate">
                                            {order?.orderId || `#${String(order?._id || a._id).slice(-8).toUpperCase()}`}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{dateLabel(closedAt(a))}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${cfg.tone}`}>
                                        <Icon size={12} /> {cfg.label}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <p className="flex items-start gap-2 text-[13px] text-gray-700">
                                        <LuUserRound size={13} className="text-gray-300 shrink-0 mt-0.5" />
                                        <span className="font-semibold truncate">{ship?.fullName || 'Customer'}</span>
                                    </p>
                                    {address && (
                                        <p className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                                            <LuMapPin size={13} className="text-gray-300 shrink-0 mt-0.5" />
                                            {address}
                                        </p>
                                    )}
                                </div>

                                {(cod > 0 || a.recipientName || a.failureReason || a.proofPhoto) && (
                                    <div className="pt-3 border-t border-gray-50 space-y-2">
                                        {cod > 0 && (
                                            <p className={`flex items-center gap-2 text-xs font-bold ${a.codCollected ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                <LuBanknote size={13} />
                                                {TK(cod)} {a.codCollected ? 'collected' : 'not collected'}
                                            </p>
                                        )}
                                        {a.recipientName && (
                                            <p className="text-xs text-gray-500">
                                                Handed to <span className="font-semibold text-gray-700">{a.recipientName}</span>
                                            </p>
                                        )}
                                        {a.failureReason && (
                                            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                                {a.failureReason}
                                            </p>
                                        )}
                                        {a.proofPhoto && (
                                            <a href={a.proofPhoto} target="_blank" rel="noopener noreferrer" className="inline-block">
                                                {/* Uploads live on the API host — next/image would need a remote loader */}
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={a.proofPhoto}
                                                    alt="Delivery proof"
                                                    className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                                                />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
