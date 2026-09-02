"use client";

import React from 'react';
import { LuInbox, LuPhone, LuMapPin, LuClock, LuUser, LuMessageSquare, LuStore, LuEye } from 'react-icons/lu';

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
    linkPrefix?: string;
}

const fmtDate = (d?: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const OrderRequestList: React.FC<Props> = ({ title, requests, isLoading, onUpdateStatus, statusFilter, setStatusFilter, showDealer, total, linkPrefix = '/dashboard/admin/order-requests' }) => {
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
                <div className="py-16 text-center bg-white rounded-xl border border-gray-100">
                    <LuInbox size={36} className="mx-auto text-gray-300" />
                    <p className="text-sm text-gray-400 mt-3">No requests {statusFilter ? `with status "${statusFilter}"` : 'yet'}.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">ID / Date</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Service / Area</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {requests.map((r) => {
                                    const area = [r.upazila?.name, r.district?.name].filter(Boolean).join(', ');
                                    return (
                                        <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-mono text-xs font-bold text-gray-700">{r.requestId}</div>
                                                <div className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">{fmtDate(r.createdAt)}</div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-semibold text-gray-800">{r.name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{r.phone}</div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-semibold text-gray-800 line-clamp-1">{r.serviceTitle || 'N/A'}</div>
                                                <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1" title={`${area}${r.address ? ` — ${r.address}` : ''}`}>
                                                    {area}{r.address ? ` — ${r.address}` : ''}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <select
                                                    value={r.status}
                                                    onChange={(e) => onUpdateStatus(r._id, e.target.value)}
                                                    className={`text-[11px] font-bold px-2 py-1 rounded-md border outline-none cursor-pointer ${badgeCls(r.status)}`}
                                                >
                                                    {STATUSES.map((sx) => <option key={sx.key} value={sx.key}>{sx.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <a 
                                                    href={`${linkPrefix}/${r._id}`}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)] border border-gray-100 transition-colors"
                                                    title="View Details"
                                                >
                                                    <LuEye size={15} />
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderRequestList;
