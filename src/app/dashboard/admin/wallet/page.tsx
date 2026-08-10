"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    LuWallet,
    LuShieldCheck,
    LuRefreshCw,
    LuTriangleAlert,
    LuCopy,
    LuCheck,
    LuX,
    LuCircleCheckBig,
    LuCircleX,
    LuLoaderCircle,
    LuArrowDownLeft,
    LuArrowUpRight,
    LuHandCoins,
    LuPercent,
    LuChevronRight,
    LuMail,
    LuPhone,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import {
    useGetWalletRequestsQuery,
    useApproveWalletRequestMutation,
    useRejectWalletRequestMutation,
    useSetProfitRateMutation,
    useRunMonthlyProfitMutation,
} from '@/redux/api/walletApi';
import { userApi } from '@/redux/api/userApi';

const LIMIT = 20;

const TK = (n: unknown) => `৳${Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

const STATUS_TABS = [
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
];

const TYPE_TABS = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'withdraw', label: 'Withdrawals' },
];

const METHOD_LABEL: Record<string, string> = {
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
    bank: 'Bank transfer',
    cash: 'Cash',
};

const STATUS_STYLE: Record<string, string> = {
    completed: 'bg-green-50 text-green-700',
    pending: 'bg-amber-50 text-amber-700',
    rejected: 'bg-red-50 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
};

const field = 'w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[var(--color-primary)] transition-colors';
const fieldLabel = 'block text-xs font-semibold text-gray-600 mb-1.5';

type Req = Record<string, any>;

const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const RoleGate = () => (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
            <LuShieldCheck size={26} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Owners only</h1>
        <p className="text-sm text-gray-500 mt-2">
            Wallet approvals move real money, so this page is limited to the site owner and administrators.
        </p>
        <Link
            href="/dashboard/user/wallet"
            className="mt-5 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-all"
        >
            Go to my wallet <LuChevronRight size={16} />
        </Link>
    </div>
);

/** The owner matches this against their own bKash statement — big, monospaced, one tap to copy. */
const TxnId = ({ value }: { value?: string }) => {
    const [copied, setCopied] = useState(false);

    if (!value) return <span className="text-xs text-gray-300">No transaction ID</span>;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy — select the ID and copy it manually');
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            title="Copy the transaction ID"
            className={`inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-xl border font-mono text-sm font-bold tracking-wide transition-all ${
                copied
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-50 text-gray-900 hover:border-[var(--color-primary)] hover:bg-white'
            }`}
        >
            <span className="break-all text-left">{value}</span>
            {copied ? <LuCheck size={15} className="shrink-0" /> : <LuCopy size={15} className="shrink-0 text-gray-400" />}
        </button>
    );
};

const TypeBadge = ({ type }: { type: string }) => {
    const deposit = type === 'deposit';
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                deposit ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
            }`}
        >
            {deposit ? <LuArrowDownLeft size={12} /> : <LuArrowUpRight size={12} />}
            {deposit ? 'Deposit' : 'Withdrawal'}
        </span>
    );
};

const Customer = ({ req }: { req: Req }) => {
    const u = req.user || {};
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return (
        <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{name || 'Deleted account'}</p>
            {u.email && (
                <a
                    href={`mailto:${u.email}`}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[var(--color-primary)] truncate"
                >
                    <LuMail size={11} className="shrink-0" /> {u.email}
                </a>
            )}
            {u.phone ? (
                <a
                    href={`tel:${String(u.phone).replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]"
                >
                    <LuPhone size={11} className="shrink-0" /> {u.phone}
                </a>
            ) : (
                <p className="text-xs text-gray-300">No phone on file</p>
            )}
        </div>
    );
};

/** The numbers that matter depend on direction: money in came *from* a number, money out goes *to* one. */
const Numbers = ({ req }: { req: Req }) => (
    <div className="space-y-0.5 text-xs">
        <p className="font-semibold text-gray-700">{METHOD_LABEL[req.method] || req.method || 'Not stated'}</p>
        {req.type === 'deposit' ? (
            <>
                <p className="text-gray-500">
                    From <span className="font-mono text-gray-800">{req.senderNumber || '—'}</span>
                </p>
                {req.receiverNumber && (
                    <p className="text-gray-400">
                        To <span className="font-mono">{req.receiverNumber}</span>
                    </p>
                )}
            </>
        ) : (
            <p className="text-gray-500">
                Send to <span className="font-mono text-gray-800">{req.receiverNumber || '—'}</span>
            </p>
        )}
    </div>
);

/** Approve / reject, or the outcome if the request has already been decided. */
const Decision = ({
    req,
    busy,
    onApprove,
    onReject,
}: {
    req: Req;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}) => {
    if (req.status !== 'pending') {
        return (
            <div className="text-xs">
                <span className={`inline-block font-bold px-2 py-1 rounded-lg capitalize ${STATUS_STYLE[req.status] || 'bg-gray-100 text-gray-500'}`}>
                    {req.status === 'completed' ? 'Approved' : req.status}
                </span>
                {req.approvedAt && <p className="text-gray-400 mt-1">{fmtDate(req.approvedAt)}</p>}
                {req.rejectionReason && (
                    <p className="text-red-500 mt-1 italic break-words max-w-[220px]">{req.rejectionReason}</p>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onApprove}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all"
            >
                {busy ? <LuLoaderCircle size={14} className="animate-spin" /> : <LuCircleCheckBig size={14} />}
                Approve
            </button>
            <button
                type="button"
                onClick={onReject}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition-all"
            >
                <LuCircleX size={14} />
                Reject
            </button>
        </div>
    );
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="w-11 h-11 -mr-2 grid place-items-center rounded-xl text-gray-400 hover:bg-gray-50"
                >
                    <LuX size={18} />
                </button>
            </div>
            <div className="p-5">{children}</div>
        </div>
    </div>
);

export default function AdminWalletPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user?.role || '') as string;
    const isOwner = isAuthenticated && (role === 'admin' || role === 'superadmin');

    const [status, setStatus] = useState('pending');
    const [type, setType] = useState('all');
    const [page, setPage] = useState(1);

    const [busyId, setBusyId] = useState<string | null>(null);
    const [approving, setApproving] = useState<Req | null>(null);
    const [rejecting, setRejecting] = useState<Req | null>(null);
    const [reason, setReason] = useState('');

    const [profitConfirm, setProfitConfirm] = useState(false);
    const [profitResult, setProfitResult] = useState<{ walletsPaid: number; totalPaid: number } | null>(null);

    const [rateForm, setRateForm] = useState({ who: '', rate: '' });
    const [resolving, setResolving] = useState(false);

    const { data, isLoading, isFetching, error, refetch } = useGetWalletRequestsQuery(
        { status, type: type !== 'all' ? type : undefined, page, limit: LIMIT },
        { skip: !isOwner }
    );

    const [approveRequest] = useApproveWalletRequestMutation();
    const [rejectRequest] = useRejectWalletRequestMutation();
    const [setProfitRate, { isLoading: savingRate }] = useSetProfitRateMutation();
    const [runMonthlyProfit, { isLoading: payingProfit }] = useRunMonthlyProfitMutation();
    const [findUsers] = userApi.useLazyGetAdminUsersQuery();

    if (!isOwner) return <RoleGate />;

    const requests: Req[] = data?.data?.transactions || [];
    const meta = data?.data?.meta || { total: 0, totalPages: 1 };
    const blockedMessage = (error as any)?.data?.message;
    const showDepositWarning = type !== 'withdraw' && status === 'pending';

    const switchFilter = (next: { status?: string; type?: string }) => {
        if (next.status !== undefined) setStatus(next.status);
        if (next.type !== undefined) setType(next.type);
        setPage(1);
    };

    const confirmApprove = async () => {
        const req = approving;
        if (!req) return;
        setBusyId(req._id);
        try {
            await approveRequest(req._id).unwrap();
            toast.success(
                req.type === 'deposit'
                    ? `Credited ${TK(req.amount)} to the customer`
                    : `Withdrawal of ${TK(req.amount)} approved`,
                { style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' } }
            );
            setApproving(null);
        } catch (err) {
            toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not approve the request');
        } finally {
            setBusyId(null);
        }
    };

    const confirmReject = async () => {
        const req = rejecting;
        const text = reason.trim();
        // The customer only ever sees this line — an empty rejection is not an answer.
        if (!req || !text) {
            toast.error('Write why you are rejecting it — the customer sees this');
            return;
        }
        setBusyId(req._id);
        try {
            await rejectRequest({ id: req._id, rejectionReason: text }).unwrap();
            toast.success('Request rejected');
            setRejecting(null);
            setReason('');
        } catch (err) {
            toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not reject the request');
        } finally {
            setBusyId(null);
        }
    };

    const confirmRunProfit = async () => {
        try {
            const res = await runMonthlyProfit(undefined).unwrap();
            const out = res?.data || {};
            setProfitResult({ walletsPaid: Number(out.walletsPaid || 0), totalPaid: Number(out.totalPaid || 0) });
            setProfitConfirm(false);
            toast.success('Monthly profit share finished');
        } catch (err) {
            toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not run the profit share');
        }
    };

    /** The API keys profit rate by user id, so an email has to be looked up first. */
    const resolveUserId = async (input: string): Promise<string | null> => {
        const v = input.trim();
        if (/^[a-f\d]{24}$/i.test(v)) return v;
        if (!v.includes('@')) {
            toast.error('Enter a user id or the full email address');
            return null;
        }
        try {
            const res = await findUsers({ searchTerm: v, limit: 5 }).unwrap();
            const list: Req[] = res?.data || [];
            const match = list.find((u) => String(u?.email || '').toLowerCase() === v.toLowerCase());
            if (!match?._id) {
                toast.error('No account found with that email');
                return null;
            }
            return String(match._id);
        } catch {
            toast.error('Could not look that customer up');
            return null;
        }
    };

    const submitRate = async (e: React.FormEvent) => {
        e.preventDefault();
        const rate = Number(rateForm.rate);
        if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
            toast.error('Enter a rate between 0 and 100');
            return;
        }
        setResolving(true);
        try {
            const userId = await resolveUserId(rateForm.who);
            if (!userId) return;
            await setProfitRate({ userId, profitRate: rate }).unwrap();
            toast.success(`Profit rate set to ${rate}% per year`, {
                style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' },
            });
            setRateForm({ who: '', rate: '' });
        } catch (err) {
            toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not set the profit rate');
        } finally {
            setResolving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <LuWallet size={22} className="text-[var(--color-primary)]" />
                        Wallet requests
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Deposits and withdrawals waiting on you. Nothing moves until you approve it.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="self-start sm:self-auto min-h-[44px] px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 transition-all"
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
                            onClick={() => switchFilter({ status: tab.id })}
                            className={`min-h-[44px] px-4 rounded-xl text-[13px] sm:text-sm font-semibold whitespace-nowrap transition-all ${
                                status === tab.id
                                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
                    {TYPE_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => switchFilter({ type: tab.id })}
                            className={`min-h-[44px] px-4 rounded-xl text-[13px] font-bold border transition-all ${
                                type === tab.id
                                    ? 'bg-gray-900 border-gray-900 text-white'
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {showDepositWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <LuTriangleAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[13px] font-semibold text-amber-800">
                        Only approve after you have confirmed the transaction ID against your own account. Approving credits
                        the customer immediately.
                    </p>
                </div>
            )}

            {blockedMessage && !isLoading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <LuTriangleAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-800">Cannot load the requests</p>
                        <p className="text-xs text-red-700 mt-0.5">{blockedMessage}</p>
                    </div>
                </div>
            )}

            {/* Requests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method &amp; numbers</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Decision</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(6)].map((__, j) => (
                                            <td key={j} className="px-5 py-5">
                                                <div className="h-4 bg-gray-100 rounded w-24" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-14 text-center">
                                        <LuWallet size={44} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-500 font-semibold">Nothing here</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {status === 'pending'
                                                ? 'No wallet requests are waiting on you right now.'
                                                : 'No requests with this filter yet.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req._id} className="hover:bg-gray-50/50 transition-colors align-top">
                                        <td className="px-5 py-4 max-w-[220px]">
                                            <Customer req={req} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <TypeBadge type={req.type} />
                                            <p className="text-base font-bold text-gray-900 mt-1.5">{TK(req.amount)}</p>
                                            {req.note && <p className="text-[11px] text-gray-400 italic mt-0.5">{req.note}</p>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <Numbers req={req} />
                                        </td>
                                        <td className="px-5 py-4 max-w-[220px]">
                                            <TxnId value={req.transactionId} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs text-gray-500">{fmtDate(req.createdAt)}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end">
                                                <Decision
                                                    req={req}
                                                    busy={busyId === req._id}
                                                    onApprove={() => setApproving(req)}
                                                    onReject={() => { setRejecting(req); setReason(''); }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden divide-y divide-gray-50">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="p-4 animate-pulse">
                                <div className="h-32 bg-gray-100 rounded-xl" />
                            </div>
                        ))
                    ) : requests.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <LuWallet size={44} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-500 font-semibold">Nothing here</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {status === 'pending'
                                    ? 'No wallet requests are waiting on you right now.'
                                    : 'No requests with this filter yet.'}
                            </p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req._id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <Customer req={req} />
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-bold text-gray-900 leading-none mb-1.5">{TK(req.amount)}</p>
                                        <TypeBadge type={req.type} />
                                    </div>
                                </div>

                                <div className="bg-gray-50/70 rounded-xl p-3 space-y-2">
                                    <Numbers req={req} />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                            Transaction ID
                                        </p>
                                        <TxnId value={req.transactionId} />
                                    </div>
                                </div>

                                <p className="text-[11px] text-gray-400">{fmtDate(req.createdAt)}</p>
                                {req.note && <p className="text-xs text-gray-500 italic">{req.note}</p>}

                                <Decision
                                    req={req}
                                    busy={busyId === req._id}
                                    onApprove={() => setApproving(req)}
                                    onReject={() => { setRejecting(req); setReason(''); }}
                                />
                            </div>
                        ))
                    )}
                </div>

                {meta.totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/30">
                        <p className="text-xs text-gray-500 font-medium">
                            {requests.length} of {meta.total}
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="min-h-[44px] px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-bold text-gray-500">
                                {page} / {meta.totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                disabled={page >= meta.totalPages}
                                className="min-h-[44px] px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Profit share */}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <LuHandCoins size={16} className="text-[var(--color-primary)]" />
                        Monthly profit share
                    </h2>
                    <p className="text-xs text-gray-500 mt-1.5">
                        Pays one month of profit into every wallet that holds a balance and has a profit rate set. It is safe
                        to press once per calendar month — a second run in the same month pays nothing extra.
                    </p>

                    {profitResult && (
                        <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5">
                            <p className="text-xs font-bold text-emerald-800">Last run</p>
                            <p className="text-sm text-emerald-700 mt-0.5">
                                <span className="font-bold">{profitResult.walletsPaid}</span> wallet
                                {profitResult.walletsPaid === 1 ? '' : 's'} paid ·{' '}
                                <span className="font-bold">{TK(profitResult.totalPaid)}</span> in total
                            </p>
                            {profitResult.walletsPaid === 0 && (
                                <p className="text-[11px] text-emerald-600 mt-1">
                                    Nothing was due — this month is already paid, or no wallet has a profit rate.
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setProfitConfirm(true)}
                        disabled={payingProfit}
                        className="mt-4 w-full sm:w-auto min-h-[44px] px-6 rounded-xl text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-all"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        {payingProfit && <LuLoaderCircle size={15} className="animate-spin" />}
                        Pay monthly profit share
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <LuPercent size={16} className="text-[var(--color-primary)]" />
                        Set a customer&apos;s profit rate
                    </h2>
                    <p className="text-xs text-gray-500 mt-1.5">
                        The annual rate used by the monthly run. Enter the user id, or an email address and we will look the
                        id up for you.
                    </p>

                    <form onSubmit={submitRate} className="mt-4 space-y-3">
                        <div>
                            <label className={fieldLabel} htmlFor="rate-who">User id or email</label>
                            <input
                                id="rate-who"
                                value={rateForm.who}
                                onChange={(e) => setRateForm({ ...rateForm, who: e.target.value })}
                                className={field}
                                placeholder="customer@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className={fieldLabel} htmlFor="rate-percent">Annual rate (%)</label>
                            <input
                                id="rate-percent"
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                value={rateForm.rate}
                                onChange={(e) => setRateForm({ ...rateForm, rate: e.target.value })}
                                className={field}
                                placeholder="8"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={savingRate || resolving}
                            className="w-full sm:w-auto min-h-[44px] px-6 rounded-xl text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-all"
                            style={{ background: 'var(--color-primary)' }}
                        >
                            {(savingRate || resolving) && <LuLoaderCircle size={15} className="animate-spin" />}
                            Save rate
                        </button>
                    </form>
                </div>
            </div>

            {/* Approve confirmation — credits land instantly, so make the owner look once more. */}
            {approving && (
                <Modal title="Approve this request?" onClose={() => setApproving(null)}>
                    <div className="space-y-3">
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <TypeBadge type={approving.type} />
                                <span className="text-lg font-bold text-gray-900">{TK(approving.amount)}</span>
                            </div>
                            <Customer req={approving} />
                            <Numbers req={approving} />
                            {approving.transactionId && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                        Transaction ID
                                    </p>
                                    <TxnId value={approving.transactionId} />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            {approving.type === 'deposit'
                                ? 'The balance is credited the moment you approve. Check the transaction ID against your own account first.'
                                : 'Approving deducts the balance now. Send the money to the number above.'}
                        </p>
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setApproving(null)}
                                className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmApprove}
                                disabled={busyId === approving._id}
                                className="flex-1 min-h-[44px] rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                            >
                                {busyId === approving._id && <LuLoaderCircle size={15} className="animate-spin" />}
                                Yes, approve
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Reject — a reason is mandatory */}
            {rejecting && (
                <Modal title="Reject this request?" onClose={() => { setRejecting(null); setReason(''); }}>
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500">
                            {TK(rejecting.amount)} · {rejecting.type === 'deposit' ? 'Deposit' : 'Withdrawal'} from{' '}
                            {`${rejecting.user?.firstName || ''} ${rejecting.user?.lastName || ''}`.trim() || 'this customer'}
                        </p>
                        <div>
                            <label className={fieldLabel} htmlFor="reject-reason">
                                Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="reject-reason"
                                rows={3}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className={`${field} resize-none`}
                                placeholder="e.g. This transaction ID does not appear in our bKash statement"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">The customer sees this on their wallet.</p>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => { setRejecting(null); setReason(''); }}
                                className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmReject}
                                disabled={!reason.trim() || busyId === rejecting._id}
                                className="flex-1 min-h-[44px] rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                            >
                                {busyId === rejecting._id && <LuLoaderCircle size={15} className="animate-spin" />}
                                Reject
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Monthly profit confirmation */}
            {profitConfirm && (
                <Modal title="Pay the monthly profit share?" onClose={() => setProfitConfirm(false)}>
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            This credits one month of profit — the annual rate divided by twelve — into every wallet that has a
                            balance above zero and a profit rate set, and is not frozen.
                        </p>
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5">
                            <LuTriangleAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">
                                It is meant to be run once per calendar month. Wallets already paid this month are skipped, so
                                pressing it twice will not double anyone&apos;s profit.
                            </p>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setProfitConfirm(false)}
                                className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmRunProfit}
                                disabled={payingProfit}
                                className="flex-1 min-h-[44px] rounded-xl text-white text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                style={{ background: 'var(--color-primary)' }}
                            >
                                {payingProfit && <LuLoaderCircle size={15} className="animate-spin" />}
                                Run it now
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
