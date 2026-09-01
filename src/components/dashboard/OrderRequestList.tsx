"use client";

import React from 'react';
import { LuInbox, LuPhone, LuMapPin, LuClock, LuUser, LuMessageSquare, LuStore } from 'react-icons/lu';

export interface OrderReq {
    _id: string;
    requestId?: string;
    serviceTitle?: string;
    name?: string;
    phone?: string;
    address?: string;
    message?: string;
    status?: string;
    createdAt?: string;
    division?: { name?: string; bnName?: string } | null;
    district?: { name?: string; bnName?: string } | null;
    upazila?: { name?: string; bnName?: string } | null;
    dealer?: { name?: string; phone?: string; level?: string } | null;
}

const STATUSES = [
    { key: 'new', label: 'New', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'contacted', label: 'Contacted', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'completed', label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'cancelled', label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
];

const badgeCls = (s?: string) => STATUSES.find((x) => x.key === s)?.cls || 'bg-gray-50 text-gray-600 border-gray-200';

interface Props {
    title: string;
    requests: OrderReq[];
    isLoading?: boolean;
    onUpdateStatus: (id: string, status: string) => void;
    statusFilter: string;
    setStatusFilter: (s: string) => void;
    /** Admin view shows which dealer the request was routed to. */
    showDealer?: boolean;
    total?: number;
}

const fmtDate = (d?: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const OrderRequestList: React.FC<Props> = ({ title, requests, isLoading, onUpdateStatus, statusFilter, setStatusFilter, showDealer, total }) => {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                        <LuInbox size={20} className="text-[var(--color-primary)]" /> {title}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Service leads from the storefront, routed by area.</p>
                </div>
            </div>

            {/* Status filter */}
            <div className="flex flex-wrap gap-2">
                {[{ key: '', label: 'All' }, ...STATUSES].map((f) => (
                    <button
                        key={f.key || 'all'}
                        onClick={() => setStatusFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${statusFilter === f.key
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        {f.label}
                    </button>
                ))}
                {typeof total === 'number' && <span className="ml-auto text-xs text-gray-400 self-center">{total} total</span>}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
            ) : requests.length === 0 ? (
                <div className="py-16 text-center">
                    <LuInbox size={36} className="mx-auto text-gray-300" />
                    <p className="text-sm text-gray-400 mt-3">No requests {statusFilter ? `with status "${statusFilter}"` : 'yet'}.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((r) => {
                        const area = [r.upazila?.name, r.district?.name].filter(Boolean).join(', ');
                        return (
                            <div key={r._id} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[11px] font-mono font-bold text-gray-400">{r.requestId}</span>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${badgeCls(r.status)}`}>{r.status}</span>
                                            <span className="text-[11px] text-gray-400 flex items-center gap-1"><LuClock size={11} /> {fmtDate(r.createdAt)}</span>
                                        </div>
                                        {r.serviceTitle && (
                                            <p className="mt-1.5 text-sm font-extrabold text-gray-900">{r.serviceTitle}</p>
                                        )}
                                    </div>
                                    <select
                                        value={r.status}
                                        onChange={(e) => onUpdateStatus(r._id, e.target.value)}
                                        className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-[var(--color-primary)]"
                                    >
                                        {STATUSES.map((sx) => <option key={sx.key} value={sx.key}>{sx.label}</option>)}
                                    </select>
                                </div>

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
                                    <p className="flex items-center gap-2 text-gray-700"><LuUser size={14} className="text-gray-400" /> {r.name}</p>
                                    <p className="flex items-center gap-2 text-gray-700">
                                        <LuPhone size={14} className="text-gray-400" />
                                        <a href={`tel:${r.phone}`} className="font-semibold text-[var(--color-primary)]">{r.phone}</a>
                                    </p>
                                    <p className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                                        <LuMapPin size={14} className="text-gray-400 shrink-0" />
                                        <span>{area}{r.address ? ` — ${r.address}` : ''}</span>
                                    </p>
                                    {showDealer && (
                                        <p className="flex items-center gap-2 text-gray-500 sm:col-span-2">
                                            <LuStore size={14} className="text-gray-400 shrink-0" />
                                            {r.dealer ? `Dealer: ${r.dealer.name}${r.dealer.level === 'district' ? ' (district)' : ''}` : 'No dealer for this area — admin handled'}
                                        </p>
                                    )}
                                </div>

                                {r.message && (
                                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
                                        <LuMessageSquare size={14} className="text-gray-400 shrink-0 mt-0.5" />
                                        <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{r.message}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrderRequestList;
