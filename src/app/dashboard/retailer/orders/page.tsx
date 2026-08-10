"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { LuPackage, LuLockKeyhole, LuBoxes, LuBuilding, LuCalendar } from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetMyRetailerOrdersQuery } from '@/redux/api/retailerApi';
import { getStatusConfig, paymentMethodLabel } from '@/lib/orderStatus';

interface OrderItem { name?: string; quantity?: number; total?: number }
interface OrderCompany { name?: string }
interface RetailerOrder {
    _id: string;
    orderId?: string;
    orderNumber?: string;
    status?: string;
    total?: number;
    createdAt?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    items?: OrderItem[];
    company?: OrderCompany | string | null;
}

const STATUS_TABS = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
];

const taka = (n?: number) => `৳${Number(n || 0).toLocaleString()}`;

const dateLabel = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const companyName = (c: RetailerOrder['company']) =>
    c && typeof c === 'object' ? c.name || '' : '';

const orderLabel = (o: RetailerOrder) =>
    o.orderId || o.orderNumber || `#${o._id.slice(-8).toUpperCase()}`;

const StatusPill = ({ status }: { status?: string }) => {
    const cfg = getStatusConfig(status || 'pending');
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.badgeBg} ${cfg.badgeText}`}>
            <Icon size={12} /> {cfg.label}
        </span>
    );
};

export default function RetailerOrdersPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user as { role?: string } | null)?.role;
    const allowed = isAuthenticated && role === 'retailer';

    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data: res, isLoading, isFetching, error } = useGetMyRetailerOrdersQuery(
        { page, limit, status: status !== 'all' ? status : undefined },
        { skip: !allowed },
    );

    const orders: RetailerOrder[] = res?.data?.orders || [];
    const meta = res?.data?.meta || { page: 1, totalPages: 1, total: 0 };

    if (!allowed) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                    <LuLockKeyhole size={26} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-2">Retailer access only</h1>
                <p className="text-sm text-gray-500 mb-6">Register your shop to place and track wholesale orders.</p>
                <Link href="/join/retailer" className="inline-block px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
                    Register my shop
                </Link>
            </div>
        );
    }

    const errorMessage = (error as { data?: { message?: string } })?.data?.message;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900">My orders</h1>
                        <p className="text-xs text-gray-400 mt-1">
                            {meta.total} wholesale order{meta.total === 1 ? '' : 's'} placed by your shop
                        </p>
                    </div>
                    <Link
                        href="/wholesale"
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                        <LuBoxes size={16} /> Buy wholesale
                    </Link>
                </div>
            </div>

            {/* Status filter */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
                <div className="flex flex-wrap gap-2">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setStatus(tab.id); setPage(1); }}
                            className={`px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                                status === tab.id
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : errorMessage ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <LuPackage size={40} className="mx-auto text-gray-200 mb-3" />
                    <h3 className="text-base font-bold text-gray-600 mb-1">Orders are not available</h3>
                    <p className="text-sm text-gray-400">{errorMessage}</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <LuPackage size={40} className="mx-auto text-gray-200 mb-3" />
                    <h3 className="text-base font-bold text-gray-600 mb-1">No orders yet</h3>
                    <p className="text-sm text-gray-400 mb-5">
                        {status === 'all'
                            ? 'Orders you place at trade prices will show up here.'
                            : 'No orders with this status.'}
                    </p>
                    {status === 'all' && (
                        <Link href="/wholesale" className="inline-block px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
                            Browse the catalogue
                        </Link>
                    )}
                </div>
            ) : (
                <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
                    {/* Stacked cards — below sm */}
                    <div className="space-y-3 sm:hidden">
                        {orders.map((o) => (
                            <div key={o._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{orderLabel(o)}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                                            <LuCalendar size={11} /> {dateLabel(o.createdAt)}
                                        </p>
                                    </div>
                                    <StatusPill status={o.status} />
                                </div>
                                {companyName(o.company) && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
                                        <LuBuilding size={12} className="text-gray-300" /> {companyName(o.company)}
                                    </p>
                                )}
                                <div className="flex items-end justify-between gap-3 pt-3 border-t border-gray-50">
                                    <div className="text-xs text-gray-500">
                                        <p>{o.items?.length || 0} item{o.items?.length === 1 ? '' : 's'}</p>
                                        <p className="mt-0.5">
                                            {o.paymentMethod ? paymentMethodLabel(o.paymentMethod) : '—'}
                                            <span className={`ml-1 font-bold capitalize ${o.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                · {o.paymentStatus || 'pending'}
                                            </span>
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-[var(--color-primary)]">{taka(o.total)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table — sm and up */}
                    <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/70">
                                    <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                                        <th className="px-5 py-3">Order</th>
                                        <th className="px-5 py-3">Supplier</th>
                                        <th className="px-5 py-3">Items</th>
                                        <th className="px-5 py-3">Payment</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orders.map((o) => (
                                        <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="text-[13px] font-bold text-gray-900">{orderLabel(o)}</p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">{dateLabel(o.createdAt)}</p>
                                            </td>
                                            <td className="px-5 py-4 text-[13px] text-gray-600">
                                                {companyName(o.company) || '—'}
                                            </td>
                                            <td className="px-5 py-4 text-[13px] text-gray-600">{o.items?.length || 0}</td>
                                            <td className="px-5 py-4">
                                                <p className="text-[13px] text-gray-600">
                                                    {o.paymentMethod ? paymentMethodLabel(o.paymentMethod) : '—'}
                                                </p>
                                                <p className={`text-[11px] font-bold capitalize ${o.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {o.paymentStatus || 'pending'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4"><StatusPill status={o.status} /></td>
                                            <td className="px-5 py-4 text-right text-[15px] font-bold text-[var(--color-primary)]">
                                                {taka(o.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
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
