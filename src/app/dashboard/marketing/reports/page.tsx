"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuLockKeyhole, LuCalendarDays, LuLogIn, LuLogOut, LuStore, LuClipboardList,
    LuHandshake, LuUsers, LuPackage, LuTrendingUp, LuMapPin, LuNotebookPen,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetMyReportsQuery } from '@/redux/api/marketingApi';

interface Stamp { at?: string | null; lat?: number | null; lng?: number | null; address?: string }
interface Visit {
    _id?: string;
    name?: string;
    type?: string;
    contact?: string;
    note?: string;
    outcome?: string;
    at?: string;
    lat?: number | null;
}
interface DailyReport {
    _id?: string;
    date?: string;
    checkIn?: Stamp;
    checkOut?: Stamp;
    visits?: Visit[];
    newDealers?: number;
    newRetailers?: number;
    ordersCollected?: number;
    salesValue?: number;
    summary?: string;
}

const OUTCOME_LABEL: Record<string, string> = {
    interested: 'Interested',
    ordered: 'Placed an order',
    follow_up: 'Needs follow-up',
    not_interested: 'Not interested',
    other: 'Other',
};

const OUTCOME_TONE: Record<string, string> = {
    interested: 'bg-blue-50 text-blue-700',
    ordered: 'bg-emerald-50 text-emerald-700',
    follow_up: 'bg-amber-50 text-amber-700',
    not_interested: 'bg-gray-100 text-gray-600',
    other: 'bg-gray-100 text-gray-600',
};

/** Bangladesh is UTC+6 all year — the server keys a field day the same way. */
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const dhakaDay = (offsetDays = 0) =>
    new Date(Date.now() + DHAKA_OFFSET_MS - offsetDays * 86400000).toISOString().slice(0, 10);

const timeLabel = (iso?: string | null) =>
    iso
        ? new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' })
        : '—';

// The `date` field is midnight UTC of the Dhaka day — render it as UTC so it
// does not slip back a day for a reader in a western timezone.
const dayLabel = (iso?: string) =>
    iso
        ? new Date(iso).toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
        })
        : '—';

const taka = (n?: number) => `৳${Number(n || 0).toLocaleString()}`;

const inputCls =
    'w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 ' +
    'outline-none transition-colors focus:border-[var(--color-primary)] ' +
    'focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]';

const Metric = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <Icon size={11} /> {label}
        </p>
        <p className="text-sm font-bold text-gray-900 mt-1">{value}</p>
    </div>
);

export default function MarketingReportsPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user as { role?: string } | null)?.role;
    const allowed = isAuthenticated && role === 'marketing_officer';

    // Default window: the last week of field work.
    const [from, setFrom] = useState(dhakaDay(6));
    const [to, setTo] = useState(dhakaDay(0));
    const [page, setPage] = useState(1);
    const limit = 15;

    const invalidRange = Boolean(from && to && from > to);

    const { data: res, isLoading, isFetching, error } = useGetMyReportsQuery(
        { from: from || undefined, to: to || undefined, page, limit },
        { skip: !allowed || invalidRange },
    );

    const reports: DailyReport[] = res?.data?.reports || [];
    const meta = res?.data?.meta || { page: 1, totalPages: 1, total: 0 };

    if (!allowed) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                    <LuLockKeyhole size={26} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-2">Field officers only</h1>
                <p className="text-sm text-gray-500 mb-6">Your daily reports appear here once you join the field team.</p>
                <Link href="/join/marketing-officer" className="inline-block px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
                    Apply as an officer
                </Link>
            </div>
        );
    }

    const apiMessage = (error as { data?: { message?: string } })?.data?.message;

    return (
        <div className="space-y-4 max-w-4xl">
            {/* Header + range */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">My reports</h1>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                    Every day you filed, with its visits, numbers and clock stamps.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2" htmlFor="from">From</label>
                        <input id="from" type="date" className={inputCls} value={from} max={to || undefined}
                            onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2" htmlFor="to">To</label>
                        <input id="to" type="date" className={inputCls} value={to} min={from || undefined}
                            onChange={(e) => { setTo(e.target.value); setPage(1); }} />
                    </div>
                </div>

                {invalidRange ? (
                    <p className="text-xs text-amber-600 mt-3">The start date is after the end date — swap them to see results.</p>
                ) : (
                    <p className="text-xs text-gray-400 mt-3">
                        {meta.total} day{meta.total === 1 ? '' : 's'} reported in this range
                    </p>
                )}
            </div>

            {/* Reports */}
            {invalidRange ? null : isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-44 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : apiMessage ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <LuClipboardList size={40} className="mx-auto text-gray-200 mb-3" />
                    <h3 className="text-base font-bold text-gray-600 mb-1">Reports are not available</h3>
                    <p className="text-sm text-gray-400">{apiMessage}</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <LuNotebookPen size={40} className="mx-auto text-gray-200 mb-3" />
                    <h3 className="text-base font-bold text-gray-600 mb-1">No reports in this range</h3>
                    <p className="text-sm text-gray-400 mb-5">Pick a wider date range, or file today&apos;s report.</p>
                    <Link href="/dashboard/marketing" className="inline-block px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
                        Go to today&apos;s work
                    </Link>
                </div>
            ) : (
                <div className={`space-y-3 ${isFetching ? 'opacity-60 transition-opacity' : ''}`}>
                    {reports.map((r) => {
                        const visits = r.visits || [];
                        return (
                            <div key={r._id || r.date} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                                {/* Day + stamps */}
                                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-gray-50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-lightest)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                                            <LuCalendarDays size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{dayLabel(r.date)}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {visits.length} visit{visits.length === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                                            <LuLogIn size={11} /> In {timeLabel(r.checkIn?.at)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                                            <LuLogOut size={11} /> Out {timeLabel(r.checkOut?.at)}
                                        </span>
                                    </div>
                                </div>

                                {/* Counters */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 py-4">
                                    <Metric icon={LuHandshake} label="New dealers" value={String(r.newDealers || 0)} />
                                    <Metric icon={LuUsers} label="New retailers" value={String(r.newRetailers || 0)} />
                                    <Metric icon={LuPackage} label="Orders" value={String(r.ordersCollected || 0)} />
                                    <Metric icon={LuTrendingUp} label="Sales" value={taka(r.salesValue)} />
                                </div>

                                {/* Visits */}
                                {visits.length > 0 && (
                                    <ul className="space-y-2 pt-3 border-t border-gray-50">
                                        {visits.map((v, i) => (
                                            <li key={v._id || i} className="flex items-start gap-3 py-1.5">
                                                <div className="w-7 h-7 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                                                    <LuStore size={13} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-[13px] font-bold text-gray-800 truncate">{v.name}</p>
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${OUTCOME_TONE[v.outcome || 'other']}`}>
                                                            {OUTCOME_LABEL[v.outcome || 'other']}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mt-0.5 capitalize">
                                                        {v.type || 'other'}
                                                        {v.contact ? ` · ${v.contact}` : ''}
                                                        {v.at ? ` · ${timeLabel(v.at)}` : ''}
                                                        {typeof v.lat === 'number' ? ' · location saved' : ''}
                                                    </p>
                                                    {v.note && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{v.note}</p>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {r.summary && (
                                    <p className="text-[13px] text-gray-600 leading-relaxed mt-3 pt-3 border-t border-gray-50">
                                        {r.summary}
                                    </p>
                                )}

                                {(r.checkIn?.address || typeof r.checkIn?.lat === 'number') && (
                                    <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1.5">
                                        <LuMapPin size={11} />
                                        {r.checkIn?.address
                                            || `${r.checkIn?.lat?.toFixed(5)}, ${r.checkIn?.lng?.toFixed(5)}`}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {!invalidRange && meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-bold text-gray-500">Page {page} of {meta.totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={page >= meta.totalPages}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
