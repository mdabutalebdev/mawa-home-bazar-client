"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    LuUserRound,
    LuPhone,
    LuMessageCircle,
    LuMapPin,
    LuBike,
    LuPercent,
    LuBadgeCheck,
    LuLockKeyhole,
    LuSave,
    LuShieldCheck,
    LuChevronRight,
    LuTriangleAlert,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetMyDealerQuery, useUpdateMyDealerMutation } from '@/redux/api/dealerApi';

const STATUS_STYLE: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    suspended: 'bg-red-50 text-red-700',
    rejected: 'bg-gray-100 text-gray-600',
};

const inputCls =
    'w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm outline-none ' +
    'focus:border-[var(--color-primary)] focus:bg-white transition-all';

const RoleGate = () => (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
            <LuShieldCheck size={26} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Dealers only</h1>
        <p className="text-sm text-gray-500 mt-2">Apply for your upazila to get a dealer profile.</p>
        <Link
            href="/join/dealer"
            className="mt-5 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-all"
        >
            Become a dealer <LuChevronRight size={16} />
        </Link>
    </div>
);

/** A server-owned value. Shown, never posted — the API rejects changes to it. */
const ReadOnlyField = ({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-white text-gray-400 border border-gray-100 flex items-center justify-center shrink-0">
            <Icon size={16} />
        </div>
        <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                {label}
                <LuLockKeyhole size={10} />
            </p>
            <div className="text-sm font-bold text-gray-800 mt-0.5">{children}</div>
        </div>
    </div>
);

export default function DealerProfilePage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user?.role || '') as string;
    const isDealer = isAuthenticated && role === 'dealer';

    const { data: dealerRes, isLoading, error } = useGetMyDealerQuery(undefined, { skip: !isDealer });
    const [updateMyDealer, { isLoading: isSaving }] = useUpdateMyDealerMutation();

    const [form, setForm] = useState({
        name: '',
        phone: '',
        whatsapp: '',
        address: '',
        homeDelivery: false,
    });

    const dealer = dealerRes?.data;

    useEffect(() => {
        if (!dealer) return;
        setForm({
            name: dealer.name || '',
            phone: dealer.phone || '',
            whatsapp: dealer.whatsapp || '',
            address: dealer.address || '',
            homeDelivery: !!dealer.homeDelivery,
        });
    }, [dealer]);

    if (!isDealer) return <RoleGate />;

    const errorMessage = (error as any)?.data?.message;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
            toast.error('Business name, phone and address are required');
            return;
        }
        try {
            await updateMyDealer({
                name: form.name.trim(),
                phone: form.phone.trim(),
                whatsapp: form.whatsapp.trim(),
                address: form.address.trim(),
                homeDelivery: form.homeDelivery,
            }).unwrap();
            toast.success('Profile updated', {
                style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' },
            });
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not update your profile');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 h-24 shadow-sm animate-pulse" />
                <div className="bg-white rounded-2xl border border-gray-100 h-40 shadow-sm animate-pulse" />
                <div className="bg-white rounded-2xl border border-gray-100 h-80 shadow-sm animate-pulse" />
            </div>
        );
    }

    if (errorMessage || !dealer) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
                    <LuTriangleAlert size={24} />
                </div>
                <h1 className="text-lg font-bold text-gray-900">No dealer profile</h1>
                <p className="text-sm text-gray-500 mt-2">{errorMessage || 'You have not applied as a dealer yet.'}</p>
                <Link
                    href="/join/dealer"
                    className="mt-5 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-all"
                >
                    Apply now <LuChevronRight size={16} />
                </Link>
            </div>
        );
    }

    const status = dealer.status || 'pending';
    const territory = [dealer.upazila?.name, dealer.district?.name, dealer.division?.name]
        .filter(Boolean)
        .join(', ');

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {(dealer.name || 'D').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{dealer.name}</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Your dealer profile</p>
                </div>
            </div>

            {/* Owner-controlled values */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Set by the marketplace owner</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ReadOnlyField icon={LuMapPin} label="Territory">
                        {territory || '—'}
                    </ReadOnlyField>
                    <ReadOnlyField icon={LuBadgeCheck} label="Status">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold capitalize ${STATUS_STYLE[status] || STATUS_STYLE.rejected}`}>
                            {status}
                        </span>
                    </ReadOnlyField>
                    <ReadOnlyField icon={LuPercent} label="Commission rate">
                        {dealer.commissionRate ?? 0}%
                    </ReadOnlyField>
                </div>
                {status === 'rejected' && dealer.rejectionReason && (
                    <p className="text-xs text-red-600 font-medium px-1">Reason: {dealer.rejectionReason}</p>
                )}
            </div>

            {/* Editable */}
            <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">My details</p>

                <div>
                    <label htmlFor="dealer-name" className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Business name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <LuUserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                            id="dealer-name"
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className={`${inputCls} pl-11`}
                            placeholder="Your business name"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dealer-phone" className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Phone <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <LuPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                            <input
                                id="dealer-phone"
                                type="tel"
                                inputMode="tel"
                                value={form.phone}
                                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                className={`${inputCls} pl-11`}
                                placeholder="01XXXXXXXXX"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="dealer-whatsapp" className="block text-xs font-semibold text-gray-600 mb-1.5">
                            WhatsApp
                        </label>
                        <div className="relative">
                            <LuMessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                            <input
                                id="dealer-whatsapp"
                                type="tel"
                                inputMode="tel"
                                value={form.whatsapp}
                                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                                className={`${inputCls} pl-11`}
                                placeholder="01XXXXXXXXX"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="dealer-address" className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="dealer-address"
                        rows={3}
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        className={`${inputCls} resize-none`}
                        placeholder="Shop or office address"
                    />
                </div>

                {/* Home delivery toggle */}
                <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, homeDelivery: !f.homeDelivery }))}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        form.homeDelivery ? 'border-emerald-200 bg-emerald-50/60' : 'border-gray-100 bg-gray-50/50'
                    }`}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${form.homeDelivery ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                        <LuBike size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900">Home delivery</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            I deliver to customers in my own upazila with my own riders.
                        </p>
                    </div>
                    <span
                        aria-hidden
                        className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-all ${form.homeDelivery ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                        <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${form.homeDelivery ? 'translate-x-5' : ''}`} />
                    </span>
                </button>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] disabled:opacity-60 transition-all shadow-md shadow-[var(--color-primary)]/20"
                >
                    <LuSave size={16} />
                    {isSaving ? 'Saving…' : 'Save changes'}
                </button>
            </form>
        </div>
    );
}
