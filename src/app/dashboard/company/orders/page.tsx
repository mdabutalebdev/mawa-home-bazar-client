"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    LuShoppingBag, LuPackage, LuPhone, LuMapPin, LuClock, LuBuilding2,
    LuChevronLeft, LuChevronRight, LuLoader, LuCircleAlert, LuUser,
} from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '@/redux';
import { useGetCompanyOrdersQuery, useUpdateCompanyOrderStatusMutation } from '@/redux/api/companyApi';
import { getStatusConfig, paymentMethodLabel } from '@/lib/orderStatus';

const LIMIT = 10;

// The only transitions a supplier owns. Cancelling, refunding and returning
// touch money, so they stay with the marketplace owner.
const COMPANY_STATUSES = ['processing', 'shipped', 'on_the_way', 'out_for_delivery', 'delivered'];

const STATUS_TABS = [
    { v: '', l: 'All' },
    { v: 'pending', l: 'Pending' },
    { v: 'confirmed', l: 'Confirmed' },
    { v: 'processing', l: 'Processing' },
    { v: 'shipped', l: 'Shipped' },
    { v: 'delivered', l: 'Delivered' },
];

const taka = (n: unknown) => `৳${Number(n || 0).toLocaleString()}`;

const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

interface OrderItem {
    _id?: string;
    name: string;
    thumbnail?: string;
    price?: number;
    quantity?: number;
    total?: number;
    color?: string;
    size?: string;
}

interface CompanyOrder {
    _id: string;
    orderId?: string;
    orderNumber?: string;
    status: string;
    createdAt?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    items?: OrderItem[];
    myItemCount?: number;
    mySubtotal?: number;
    shippingAddress?: { fullName?: string; phone?: string; city?: string; area?: string };
    upazila?: { name?: string; bnName?: string } | null;
    dealer?: { name?: string; phone?: string; whatsapp?: string } | null;
    dealerConfirmation?: { confirmedAt?: string | null; note?: string };
}

const StatusBadge = ({ status }: { status: string }) => {
    const cfg = getStatusConfig(status);
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.badgeBg} ${cfg.badgeText}`}>
            <Icon size={12} /> {cfg.label}
        </span>
    );
};

function CompanyOrdersContent() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = user?.role as string | undefined;
    const isCompany = role === 'company';

    const searchParams = useSearchParams();
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [page, setPage] = useState(1);
    const [busyId, setBusyId] = useState<string | null>(null);

    // The overview tiles deep-link here with ?status= — honour whatever arrives.
    useEffect(() => {
        setStatus(searchParams.get('status') || '');
        setPage(1);
    }, [searchParams]);

    const { data, isLoading, isFetching } = useGetCompanyOrdersQuery(
        { status: status || undefined, page, limit: LIMIT },
        { skip: !isCompany }
    );
    const [updateStatus] = useUpdateCompanyOrderStatusMutation();

    const orders: CompanyOrder[] = data?.data?.orders || [];
    const meta = data?.data?.meta || { total: 0, totalPages: 1 };

    if (!isAuthenticated || !isCompany) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.08)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                    <LuBuilding2 size={24} />
                </div>
                <h1 className="text-lg font-extrabold text-gray-900">Company account required</h1>
                <p className="text-sm text-gray-500 leading-relaxed mt-2">
                    Only approved supplier companies can see orders for their own goods.
                </p>
                <Link
                    href="/join/company"
                    className="inline-flex items-center justify-center gap-2 w-full mt-5 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                    Apply as a company
                </Link>
            </div>
        );
    }

    const handleStatus = async (order: CompanyOrder, next: string) => {
        if (!next || next === order.status) return;
        setBusyId(order._id);
        try {
            await updateStatus({ id: order._id, status: next }).unwrap();
            toast.success(`Marked as ${getStatusConfig(next).label}`);
        } catch (err) {
            toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not update the order');
        } finally {
            setBusyId(null);
        }
    };

    const chipCls = (active: boolean) =>
        `px-3.5 min-h-[38px] inline-flex items-center rounded-xl text-[13px] font-bold whitespace-nowrap transition-colors ${
            active
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[rgba(var(--color-primary-rgb),0.35)]'
        }`;

    return (
        <div className="space-y-4">

            {/* ── Header ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">Orders for my goods</h1>
                <p className="text-[13px] text-gray-500 mt-0.5">
                    {meta.total} order{meta.total === 1 ? '' : 's'} contain your products. You only ever see your own
                    lines and your own subtotal.
                </p>
            </div>

            {/* ── Status filter ── */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {STATUS_TABS.map((t) => (
                    <button
                        key={t.v || 'all'}
                        type="button"
                        onClick={() => { setStatus(t.v); setPage(1); }}
                        className={chipCls(status === t.v)}
                    >
                        {t.l}
                    </button>
                ))}
            </div>

            {/* ── List ── */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="h-4 w-32 bg-gray-200 rounded" />
                                <div className="h-6 w-24 bg-gray-100 rounded-lg" />
                            </div>
                            <div className="h-16 bg-gray-50 rounded-xl mb-3" />
                            <div className="h-4 w-40 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.07)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                        <LuShoppingBag size={28} />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-800">
                        {status ? 'No orders in this state' : 'No orders yet'}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mt-2 max-w-md mx-auto">
                        {status
                            ? 'Try another filter — your other orders are still there.'
                            : 'Once a customer buys one of your products, the order lands here and the local dealer confirms it by phone.'}
                    </p>
                    {!status && (
                        <Link
                            href="/dashboard/company/products"
                            className="inline-flex items-center justify-center gap-2 mt-6 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            <LuPackage size={16} /> Manage my products
                        </Link>
                    )}
                </div>
            ) : (
                <div className={`space-y-3 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                    {orders.map((order) => {
                        const confirmed = Boolean(order.dealerConfirmation?.confirmedAt);
                        const busy = busyId === order._id;
                        const items = order.items || [];

                        return (
                            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-4">
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-extrabold text-[var(--color-primary)]">
                                                {order.orderId || order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {formatDate(order.createdAt)}
                                                {order.paymentMethod ? ` · ${paymentMethodLabel(order.paymentMethod)}` : ''}
                                                {order.paymentStatus ? ` · ${order.paymentStatus}` : ''}
                                            </p>
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>

                                    {/* My lines only — this list is already filtered server-side to
                                        this company, so nothing here belongs to another supplier. */}
                                    <div className="mt-3 space-y-2">
                                        {items.map((item, i) => (
                                            <div key={item._id || i} className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                                    {item.thumbnail ? (
                                                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><LuPackage size={15} /></div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-bold text-gray-800 leading-snug line-clamp-2">{item.name}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        {taka(item.price)} × {item.quantity ?? 1}
                                                        {item.color ? ` · ${item.color}` : ''}
                                                        {item.size ? ` · ${item.size}` : ''}
                                                    </p>
                                                </div>
                                                <p className="text-[13px] font-extrabold text-gray-800 flex-shrink-0">{taka(item.total)}</p>
                                            </div>
                                        ))}
                                        {items.length === 0 && (
                                            <p className="text-[12px] text-gray-400">No lines of yours on this order.</p>
                                        )}
                                    </div>

                                    {/* Customer / area / dealer */}
                                    <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-[12px] text-gray-500">
                                        {order.shippingAddress?.fullName && (
                                            <span className="inline-flex items-center gap-1.5 min-w-0">
                                                <LuUser size={12} className="text-gray-300 flex-shrink-0" />
                                                <span className="truncate">{order.shippingAddress.fullName}</span>
                                            </span>
                                        )}
                                        {(order.upazila?.name || order.shippingAddress?.city) && (
                                            <span className="inline-flex items-center gap-1.5 min-w-0">
                                                <LuMapPin size={12} className="text-gray-300 flex-shrink-0" />
                                                <span className="truncate">{order.upazila?.name || order.shippingAddress?.city}</span>
                                            </span>
                                        )}
                                        {order.dealer?.name && (
                                            <span className="inline-flex items-center gap-1.5 min-w-0">
                                                <LuBuilding2 size={12} className="text-gray-300 flex-shrink-0" />
                                                <span className="truncate">Dealer: {order.dealer.name}</span>
                                            </span>
                                        )}
                                        {order.dealer?.phone && (
                                            <a href={`tel:${order.dealer.phone}`} className="inline-flex items-center gap-1.5 min-w-0 font-semibold text-[var(--color-primary)]">
                                                <LuPhone size={12} className="flex-shrink-0" />
                                                <span className="truncate">{order.dealer.phone}</span>
                                            </a>
                                        )}
                                    </div>

                                    {/* My subtotal — deliberately NOT the order total, which may
                                        include another supplier's goods. */}
                                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-end justify-between gap-3">
                                        <p className="text-[11px] text-gray-400 font-semibold">
                                            {order.myItemCount ?? items.length} line{(order.myItemCount ?? items.length) === 1 ? '' : 's'} of yours
                                        </p>
                                        <div className="text-right leading-none">
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">My subtotal</span>
                                            <span className="block text-lg font-extrabold text-[var(--color-primary)]">{taka(order.mySubtotal)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status control */}
                                <div className="bg-gray-50/70 border-t border-gray-100 px-4 py-3">
                                    {!confirmed && (
                                        <div className="flex items-start gap-2 mb-2.5">
                                            <LuClock size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-[12px] font-semibold text-amber-700 leading-snug">
                                                Waiting for the dealer to confirm
                                                <span className="block font-normal text-amber-600/90 mt-0.5">
                                                    The dealer calls the customer and you before this ships. Until then only
                                                    &ldquo;Processing&rdquo; is open.
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <label htmlFor={`st-${order._id}`} className="text-[12px] font-bold text-gray-500 flex-shrink-0">
                                            Update status
                                        </label>
                                        <select
                                            id={`st-${order._id}`}
                                            value={COMPANY_STATUSES.includes(order.status) ? order.status : ''}
                                            disabled={busy}
                                            onChange={(e) => handleStatus(order, e.target.value)}
                                            className="flex-1 min-h-[42px] px-3 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)] disabled:opacity-50 transition-colors"
                                        >
                                            <option value="">Choose…</option>
                                            {COMPANY_STATUSES.map((s) => (
                                                <option
                                                    key={s}
                                                    value={s}
                                                    // Everything past 'processing' needs the dealer's stamp —
                                                    // the server refuses it too, so mirror that here.
                                                    disabled={!confirmed && s !== 'processing'}
                                                >
                                                    {getStatusConfig(s).label}
                                                    {!confirmed && s !== 'processing' ? ' — needs dealer confirmation' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {busy && <LuLoader size={16} className="animate-spin text-[var(--color-primary)] flex-shrink-0" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Pagination ── */}
            {!isLoading && meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Previous page"
                        className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors"
                    >
                        <LuChevronLeft size={17} />
                    </button>
                    <span className="text-[13px] font-bold text-gray-500">Page {page} of {meta.totalPages}</span>
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={page >= meta.totalPages}
                        aria-label="Next page"
                        className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors"
                    >
                        <LuChevronRight size={17} />
                    </button>
                </div>
            )}

            {/* A quiet reminder about what this page deliberately hides. */}
            {!isLoading && orders.length > 0 && (
                <p className="flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed px-1">
                    <LuCircleAlert size={13} className="flex-shrink-0 mt-0.5" />
                    Order totals are not shown here — a customer&apos;s cart can hold another supplier&apos;s goods too.
                    The figure above is what your own lines come to.
                </p>
            )}
        </div>
    );
}

export default function CompanyOrdersPage() {
    return (
        <Suspense fallback={<div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-28 animate-pulse" />}>
            <CompanyOrdersContent />
        </Suspense>
    );
}
