"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    LuWallet, LuArrowDownLeft, LuArrowUpRight, LuTrendingUp,
    LuUsers, LuCopy, LuCheck, LuLoaderCircle,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import {
    useGetMyWalletQuery,
    useGetMyWalletTransactionsQuery,
    useRequestDepositMutation,
    useRequestWithdrawMutation,
} from '@/redux/api/walletApi';

const TK = (n: number) => `৳${Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

const LABEL: Record<string, string> = {
    deposit: 'Deposit',
    withdraw: 'Withdrawal',
    profit: 'Profit share',
    referral_commission: 'Referral commission',
    dealer_commission: 'Dealer commission',
    order_payment: 'Order payment',
    refund: 'Refund',
    adjustment: 'Adjustment',
};
const CREDIT = ['deposit', 'profit', 'referral_commission', 'dealer_commission', 'refund'];

const STATUS_STYLE: Record<string, string> = {
    completed: 'bg-green-50 text-green-700',
    pending: 'bg-amber-50 text-amber-700',
    rejected: 'bg-red-50 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
};

const field = 'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[var(--color-primary)] transition-colors';
const label = 'block text-xs font-semibold text-gray-600 mb-1.5';

export default function WalletPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);

    // Guarded even though the dashboard layout already blocks signed-out
    // visitors: baseApi turns any stray 401 into a hard "session expired"
    // redirect, so an unguarded authenticated query is a latent bug waiting for
    // the day this page is reached some other way.
    const { data: walletRes, isLoading } = useGetMyWalletQuery(undefined, { skip: !isAuthenticated });
    const { data: txnRes, isLoading: txnLoading } = useGetMyWalletTransactionsQuery(undefined, { skip: !isAuthenticated });
    const { data: siteRes } = useGetSiteContentQuery({});

    const [requestDeposit, { isLoading: depositing }] = useRequestDepositMutation();
    const [requestWithdraw, { isLoading: withdrawing }] = useRequestWithdrawMutation();

    const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [copied, setCopied] = useState(false);
    const [dep, setDep] = useState({ amount: '', method: 'bkash', transactionId: '', senderNumber: '' });
    const [wd, setWd] = useState({ amount: '', method: 'bkash', receiverNumber: '' });

    const wallet = walletRes?.data;
    const transactions = txnRes?.data?.transactions || [];
    const payment = siteRes?.data?.payment || {};

    // Where the customer should send the money — the shop's own published numbers.
    const receivers = ['bkash', 'nagad', 'rocket']
        .map((k) => ({ id: k, ...(payment[k] || {}) }))
        .filter((w) => w.active !== false && w.number);

    const referralLink = typeof window !== 'undefined' && user?.referralCode
        ? `${window.location.origin}/register?ref=${user.referralCode}`
        : '';

    const copyReferral = async () => {
        if (!referralLink) return;
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const submitDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await requestDeposit({
                amount: Number(dep.amount),
                method: dep.method,
                transactionId: dep.transactionId.trim(),
                senderNumber: dep.senderNumber.trim(),
                receiverNumber: receivers.find((r) => r.id === dep.method)?.number || '',
            }).unwrap();
            toast.success('Submitted — we will credit it once the payment is verified');
            setDep({ amount: '', method: 'bkash', transactionId: '', senderNumber: '' });
        } catch (err) {
            const e2 = err as { data?: { message?: string } };
            toast.error(e2?.data?.message || 'Could not submit the deposit');
        }
    };

    const submitWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await requestWithdraw({
                amount: Number(wd.amount),
                method: wd.method,
                receiverNumber: wd.receiverNumber.trim(),
            }).unwrap();
            toast.success('Withdrawal requested');
            setWd({ amount: '', method: 'bkash', receiverNumber: '' });
        } catch (err) {
            const e2 = err as { data?: { message?: string } };
            toast.error(e2?.data?.message || 'Could not request the withdrawal');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
                <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* ── Balance ── */}
            <div
                className="rounded-2xl p-6 text-white"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), #ff8c5a)' }}
            >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-xs opacity-80 flex items-center gap-1.5"><LuWallet size={14} /> Available balance</p>
                        <p className="text-3xl font-extrabold mt-1">{TK(wallet?.available ?? wallet?.balance)}</p>
                        {Number(wallet?.pendingWithdrawal) > 0 && (
                            <p className="text-[11px] opacity-80 mt-1">
                                {TK(wallet.pendingWithdrawal)} held against a pending withdrawal
                            </p>
                        )}
                    </div>
                    {Number(wallet?.profitRate) > 0 && (
                        <div className="text-right">
                            <p className="text-xs opacity-80 flex items-center gap-1.5 justify-end"><LuTrendingUp size={14} /> Profit share</p>
                            <p className="text-lg font-bold">{wallet.profitRate}% <span className="text-xs font-normal opacity-80">per year</span></p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/20">
                    {[
                        ['Deposited', wallet?.totalDeposited],
                        ['Profit earned', wallet?.totalProfit],
                        ['Commission', wallet?.totalCommission],
                        ['Withdrawn', wallet?.totalWithdrawn],
                    ].map(([k, v]) => (
                        <div key={String(k)}>
                            <p className="text-[10px] uppercase tracking-wide opacity-70">{k}</p>
                            <p className="text-sm font-bold">{TK(Number(v))}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Referral ── */}
            {user?.referralCode && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
                        <LuUsers size={15} /> Invite and earn
                    </h2>
                    <p className="text-xs text-gray-500 mb-3">
                        Share your link. You earn a commission on every order the people you invite place.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <code className="flex-1 min-w-[200px] text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 truncate">
                            {referralLink || user.referralCode}
                        </code>
                        <button
                            onClick={copyReferral}
                            className="px-4 py-2.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5"
                            style={{ background: 'var(--color-primary)' }}
                        >
                            {copied ? <LuCheck size={14} /> : <LuCopy size={14} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Deposit / withdraw ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {(['deposit', 'withdraw'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className="flex-1 py-3.5 text-sm font-semibold capitalize transition-colors"
                            style={tab === t
                                ? { color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)' }
                                : { color: '#9ca3af' }}
                        >
                            {t === 'deposit' ? 'Add money' : 'Withdraw'}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    {tab === 'deposit' ? (
                        <form onSubmit={submitDeposit} className="space-y-4">
                            {receivers.length > 0 ? (
                                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3.5">
                                    <p className="text-xs font-semibold text-amber-900 mb-1.5">Send the money first, then fill this in:</p>
                                    <ul className="text-xs text-amber-800 space-y-0.5">
                                        {receivers.map((r) => (
                                            <li key={r.id}>
                                                <span className="capitalize font-semibold">{r.id === 'bkash' ? 'bKash' : r.id}</span>: {r.number} ({r.accountType || 'Personal'})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    No deposit number is published yet — please contact support before sending money.
                                </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={label}>Amount you sent <span className="text-red-500">*</span></label>
                                    <input type="number" min={1} required value={dep.amount}
                                        onChange={(e) => setDep({ ...dep, amount: e.target.value })}
                                        className={field} placeholder="1000" />
                                </div>
                                <div>
                                    <label className={label}>Method</label>
                                    <select value={dep.method} onChange={(e) => setDep({ ...dep, method: e.target.value })} className={field}>
                                        <option value="bkash">bKash</option>
                                        <option value="nagad">Nagad</option>
                                        <option value="rocket">Rocket</option>
                                        <option value="bank">Bank transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={label}>Your number <span className="text-red-500">*</span></label>
                                    <input required value={dep.senderNumber}
                                        onChange={(e) => setDep({ ...dep, senderNumber: e.target.value })}
                                        className={field} placeholder="01XXXXXXXXX" />
                                </div>
                                <div>
                                    <label className={label}>Transaction ID <span className="text-red-500">*</span></label>
                                    <input required value={dep.transactionId}
                                        onChange={(e) => setDep({ ...dep, transactionId: e.target.value })}
                                        className={field} placeholder="e.g. 8N7A6B5C4D" />
                                </div>
                            </div>

                            <button type="submit" disabled={depositing}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: 'var(--color-primary)' }}>
                                {depositing && <LuLoaderCircle size={14} className="animate-spin" />}
                                Submit deposit
                            </button>
                            <p className="text-[11px] text-gray-400">
                                Deposits are credited after we match the transaction ID against our account — usually within a few hours.
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={submitWithdraw} className="space-y-4">
                            <p className="text-xs text-gray-500">
                                You can withdraw up to <strong>{TK(wallet?.available)}</strong>.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className={label}>Amount <span className="text-red-500">*</span></label>
                                    <input type="number" min={1} required value={wd.amount}
                                        onChange={(e) => setWd({ ...wd, amount: e.target.value })}
                                        className={field} placeholder="500" />
                                </div>
                                <div>
                                    <label className={label}>Method</label>
                                    <select value={wd.method} onChange={(e) => setWd({ ...wd, method: e.target.value })} className={field}>
                                        <option value="bkash">bKash</option>
                                        <option value="nagad">Nagad</option>
                                        <option value="rocket">Rocket</option>
                                        <option value="bank">Bank transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={label}>Send to <span className="text-red-500">*</span></label>
                                    <input required value={wd.receiverNumber}
                                        onChange={(e) => setWd({ ...wd, receiverNumber: e.target.value })}
                                        className={field} placeholder="01XXXXXXXXX" />
                                </div>
                            </div>
                            <button type="submit" disabled={withdrawing}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: 'var(--color-primary)' }}>
                                {withdrawing && <LuLoaderCircle size={14} className="animate-spin" />}
                                Request withdrawal
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* ── Ledger ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <h2 className="text-sm font-bold text-gray-900 px-5 py-4 border-b border-gray-100">Transactions</h2>
                {txnLoading ? (
                    <div className="p-5 space-y-2">
                        {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}
                    </div>
                ) : transactions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No transactions yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {transactions.map((t: Record<string, string | number>) => {
                            const credit = CREDIT.includes(String(t.type));
                            return (
                                <li key={String(t._id)} className="flex items-center gap-3 px-5 py-3.5">
                                    <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${credit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                        {credit ? <LuArrowDownLeft size={16} /> : <LuArrowUpRight size={16} />}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">{LABEL[String(t.type)] || String(t.type)}</p>
                                        <p className="text-[11px] text-gray-400 truncate">
                                            {new Date(String(t.createdAt)).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                                            {t.note ? ` · ${t.note}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-sm font-bold ${credit ? 'text-green-600' : 'text-gray-800'}`}>
                                            {credit ? '+' : '−'}{TK(Number(t.amount))}
                                        </p>
                                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLE[String(t.status)] || 'bg-gray-100 text-gray-500'}`}>
                                            {String(t.status)}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
