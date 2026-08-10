"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
    LuPackage,
    LuPhone,
    LuMessageCircle,
    LuPhoneCall,
    LuCircleCheckBig,
    LuUserRound,
    LuBuilding2,
    LuShieldCheck,
    LuChevronRight,
    LuRefreshCw,
    LuStickyNote,
    LuTriangleAlert,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetDealerOrdersQuery, useConfirmDealerOrderMutation } from '@/redux/api/dealerApi';
import { getStatusConfig } from '@/lib/orderStatus';

const LIMIT = 10;

const STATUS_TABS = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'out_for_delivery', label: 'Out For Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
];

/** Dialable form — keep a leading + but drop spaces, dashes and brackets. */
const telHref = (phone?: string) => `tel:${(phone || '').replace(/[^\d+]/g, '')}`;

/**
 * wa.me wants a bare international number. Bangladeshi numbers are typed as
 * 01XXXXXXXXX locally, so the leading 0 is dropped and 880 prefixed.
 */
const waHref = (phone?: string) => {
    let d = (phone || '').replace(/\D/g, '');
    if (!d) return '';
    if (!d.startsWith('880')) d = `880${d.replace(/^0+/, '')}`;
    return `https://wa.me/${d}`;
};

const StatusBadge = ({ status }: { status: string }) => {
    const cfg = getStatusConfig(status);
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.badgeBg} ${cfg.badgeText}`}>
            <Icon size={12} />
            {cfg.label}
        </span>
    );
};

const RoleGate = () => (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
            <LuShieldCheck size={26} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Dealers only</h1>
        <p className="text-sm text-gray-500 mt-2">This order queue belongs to the dealer of an upazila.</p>
        <Link
            href="/join/dealer"
            className="mt-5 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-all"
        >
            Become a dealer <LuChevronRight size={16} />
        </Link>
    </div>
);

/** Name + phone of one side of the call, with the number itself dialable. */
const Party = ({ icon: Icon, role, name, phone }: { icon: React.ElementType; role: string; name: string; phone?: string }) => (
    <div className="flex items-start gap-3 p-4 sm:p-5">
        <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
            <Icon size={16} />
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{role}</p>
            <p className="text-sm font-bold text-gray-900 truncate">{name || '—'}</p>
            {phone ? (
                <a href={telHref(phone)} className="text-xs font-semibold text-[var(--color-primary)] hover:underline">
                    {phone}
                </a>
            ) : (
                <p className="text-xs text-gray-400">No phone on file</p>
            )}
        </div>
    </div>
);

/** One leg of the confirmation: the tick, a direct dial and a WhatsApp jump. */
const CallLeg = ({
    label, phone, waPhone, done, doneAt, busy, onTick,
}: {
    label: string; phone?: string; waPhone?: string; done: boolean; doneAt?: string;
    busy: boolean; onTick: () => void;
}) => (
    <div className={`flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl border ${done ? 'border-emerald-200 bg-emerald-50/70' : 'border-gray-200 bg-white'}`}>
        <label className={`flex items-center gap-2.5 min-w-0 flex-1 ${done ? 'cursor-default' : 'cursor-pointer'}`}>
            <input
                type="checkbox"
                checked={done}
                disabled={done || busy}
                onChange={onTick}
                className="w-5 h-5 rounded border-gray-300 accent-emerald-600 cursor-pointer disabled:cursor-default shrink-0"
            />
            <span className="min-w-0">
                <span className={`block text-[13px] font-bold truncate ${done ? 'text-emerald-800' : 'text-gray-700'}`}>
                    {label}
                </span>
                {done && doneAt && (
                    <span className="block text-[10px] text-emerald-600 font-medium">
                        {new Date(doneAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </span>
        </label>

        <div className="flex items-center gap-2 ml-auto">
            {(phone || waPhone) ? (
                <>
                    <a
                        href={telHref(phone || waPhone)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all"
                    >
                        <LuPhone size={13} /> Call
                    </a>
                    <a
                        href={waHref(waPhone || phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all"
                    >
                        <LuMessageCircle size={13} /> WhatsApp
                    </a>
                </>
            ) : (
                <span className="text-[11px] text-gray-400 font-medium">No number</span>
            )}
        </div>
    </div>
);

function DealerOrdersContent() {
    const searchParams = useSearchParams();
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user?.role || '') as string;
    const isDealer = isAuthenticated && role === 'dealer';

    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [needsCall, setNeedsCall] = useState(searchParams.get('confirmed') === 'false');
    const [page, setPage] = useState(1);
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [busyId, setBusyId] = useState<string | null>(null);

    // The overview links in with ?confirmed=false / ?status=… — honour it.
    useEffect(() => {
        setStatus(searchParams.get('status') || 'all');
        setNeedsCall(searchParams.get('confirmed') === 'false');
        setPage(1);
    }, [searchParams]);

    const { data, isLoading, isFetching, error, refetch } = useGetDealerOrdersQuery(
        {
            page,
            limit: LIMIT,
            status: status !== 'all' ? status : undefined,
            confirmed: needsCall ? 'false' : undefined,
        },
        { skip: !isDealer }
    );

    const [confirmOrder] = useConfirmDealerOrderMutation();

    if (!isDealer) return <RoleGate />;

    const orders: any[] = data?.data?.orders || [];
    const meta = data?.data?.meta || { total: 0, totalPages: 1 };
    const blockedMessage = (error as any)?.data?.message;

    const record = async (order: any, leg: 'customer' | 'company') => {
        const id = order._id;
        setBusyId(`${id}:${leg}`);
        try {
            const note = (notes[id] || '').trim();
            await confirmOrder({
                id,
                ...(leg === 'customer' ? { customerCalled: true } : { companyCalled: true }),
                ...(note ? { note } : {}),
            }).unwrap();
            toast.success(leg === 'customer' ? 'Customer call recorded' : 'Company call recorded', {
                style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' },
            });
            setNotes((prev) => ({ ...prev, [id]: '' }));
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not record the call');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order queue</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Phone the customer and the company, then tick both — that is what lets the company ship.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="self-start sm:self-auto px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 transition-all"
                >
                    <LuRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap gap-2">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setStatus(tab.id); setPage(1); }}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[13px] sm:text-sm font-semibold whitespace-nowrap transition-all ${
                                status === tab.id
                                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="pt-3 border-t border-gray-50">
                    <button
                        onClick={() => { setNeedsCall((v) => !v); setPage(1); }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${
                            needsCall
                                ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <LuPhoneCall size={15} />
                        Needs my call
                    </button>
                </div>
            </div>

            {blockedMessage && !isLoading && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <LuTriangleAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Cannot load the queue</p>
                        <p className="text-xs text-amber-700 mt-0.5">{blockedMessage}</p>
                    </div>
                </div>
            )}

            {/* Orders */}
            <div className="space-y-3">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse space-y-3">
                            <div className="flex justify-between">
                                <div className="h-5 bg-gray-200 rounded w-28" />
                                <div className="h-6 bg-gray-200 rounded w-20" />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="h-14 bg-gray-100 rounded-xl" />
                                <div className="h-14 bg-gray-100 rounded-xl" />
                            </div>
                            <div className="h-20 bg-gray-50 rounded-xl" />
                        </div>
                    ))
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
                        <LuPackage size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-lg font-bold text-gray-600 mb-1">Nothing here</h3>
                        <p className="text-sm text-gray-400">
                            {needsCall
                                ? 'Every order in your area has been confirmed. Nice work.'
                                : status !== 'all'
                                    ? 'No orders with this status yet.'
                                    : 'Orders placed in your upazila will show up here.'}
                        </p>
                    </div>
                ) : (
                    orders.map((order: any) => {
                        const conf = order.dealerConfirmation || {};
                        const confirmed = !!conf.confirmedAt;
                        const customerName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim()
                            || order.shippingAddress?.fullName
                            || 'Customer';
                        const customerPhone = order.user?.phone || order.shippingAddress?.phone;
                        const companyName = order.company?.name || 'Not assigned';
                        const companyPhone = order.company?.phone;
                        const companyWa = order.company?.whatsapp || order.company?.phone;

                        return (
                            <div
                                key={order._id}
                                className={`bg-white rounded-2xl shadow-sm overflow-hidden border transition-all ${
                                    confirmed ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-100'
                                }`}
                            >
                                {/* Head: id, date, total, status */}
                                <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[var(--color-primary)] truncate">
                                            {order.orderId || `#${String(order._id).slice(-8).toUpperCase()}`}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                            {order.upazila?.name ? ` · ${order.upazila.name}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-bold text-gray-900 leading-none mb-2">
                                            ৳{Number(order.total || 0).toLocaleString()}
                                        </p>
                                        <StatusBadge status={order.status} />
                                    </div>
                                </div>

                                {/* Who to call */}
                                <div className="grid sm:grid-cols-2 border-y border-gray-50 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
                                    <Party icon={LuUserRound} role="Customer" name={customerName} phone={customerPhone} />
                                    <Party icon={LuBuilding2} role="Supplying company" name={companyName} phone={companyPhone} />
                                </div>

                                {/* Confirmation */}
                                <div className={`p-4 sm:p-5 space-y-2.5 ${confirmed ? 'bg-emerald-50/50' : 'bg-gray-50/50'}`}>
                                    {confirmed ? (
                                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-emerald-500 text-white">
                                            <LuCircleCheckBig size={20} className="shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold">Confirmed — the company can ship</p>
                                                <p className="text-[11px] text-emerald-50">
                                                    Both calls done on {new Date(conf.confirmedAt).toLocaleString('en-US', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">
                                            Awaiting your call
                                        </p>
                                    )}

                                    <CallLeg
                                        label="Called the customer"
                                        phone={customerPhone}
                                        done={!!conf.customerCalled}
                                        doneAt={conf.customerCalledAt}
                                        busy={busyId === `${order._id}:customer`}
                                        onTick={() => record(order, 'customer')}
                                    />
                                    <CallLeg
                                        label="Called the company"
                                        phone={companyPhone}
                                        waPhone={companyWa}
                                        done={!!conf.companyCalled}
                                        doneAt={conf.companyCalledAt}
                                        busy={busyId === `${order._id}:company`}
                                        onTick={() => record(order, 'company')}
                                    />

                                    {conf.note && (
                                        <p className="flex items-start gap-2 text-xs text-gray-500 px-1">
                                            <LuStickyNote size={13} className="shrink-0 mt-0.5 text-gray-400" />
                                            <span className="italic">{conf.note}</span>
                                        </p>
                                    )}

                                    {!confirmed && (
                                        <input
                                            type="text"
                                            value={notes[order._id] || ''}
                                            onChange={(e) => setNotes((prev) => ({ ...prev, [order._id]: e.target.value }))}
                                            placeholder="Note from the call (optional) — saved with the next tick"
                                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-bold text-gray-500">
                        Page {page} of {meta.totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={page === meta.totalPages}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default function DealerOrdersPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 h-24 shadow-sm animate-pulse" />
                    <div className="bg-white rounded-2xl border border-gray-100 h-64 shadow-sm animate-pulse" />
                </div>
            }
        >
            <DealerOrdersContent />
        </Suspense>
    );
}
