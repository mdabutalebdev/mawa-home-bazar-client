"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    LuStore, LuLockKeyhole, LuLoaderCircle, LuLock, LuMapPin, LuWallet, LuShieldCheck,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetMyRetailerQuery, useUpdateMyRetailerMutation } from '@/redux/api/retailerApi';

interface Area { _id: string; name?: string; bnName?: string }

interface Retailer {
    shopName?: string;
    ownerName?: string;
    shopType?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    nid?: string;
    tradeLicense?: string;
    status?: string;
    creditLimit?: number;
    creditUsed?: number;
    upazila?: Area | string | null;
    district?: Area | string | null;
    division?: Area | string | null;
}

const SHOP_TYPES = [
    { value: 'grocery', label: 'Grocery Store' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'cosmetics', label: 'Cosmetics' },
    { value: 'stationery', label: 'Stationery' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'other', label: 'Other' },
];

const STATUS_TONE: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    rejected: 'bg-red-50 text-red-700',
    suspended: 'bg-red-50 text-red-700',
};

const inputCls =
    'w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 ' +
    'placeholder:text-gray-400 outline-none transition-colors ' +
    'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]';

const readonlyCls =
    'w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500 cursor-not-allowed';

const labelCls = 'block text-xs font-bold text-gray-500 mb-2';

const emptyForm = {
    shopName: '',
    ownerName: '',
    shopType: 'grocery',
    phone: '',
    whatsapp: '',
    address: '',
    nid: '',
    tradeLicense: '',
};

type FormState = typeof emptyForm;

const taka = (n?: number) => `৳${Number(n || 0).toLocaleString()}`;

const nameOf = (area: Area | string | null | undefined): string =>
    area && typeof area === 'object' ? area.name || '' : '';

export default function RetailerProfilePage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user as { role?: string } | null)?.role;
    const allowed = isAuthenticated && role === 'retailer';

    const { data: res, isLoading, error } = useGetMyRetailerQuery(undefined, { skip: !allowed });
    const [updateMyRetailer, { isLoading: isSaving }] = useUpdateMyRetailerMutation();

    const retailer: Retailer | undefined = res?.data;
    const [form, setForm] = useState<FormState>(emptyForm);

    // Seed the form once the shop lands; a re-fetch after saving refills it with
    // whatever the server actually stored.
    useEffect(() => {
        if (!retailer) return;
        setForm({
            shopName: retailer.shopName || '',
            ownerName: retailer.ownerName || '',
            shopType: retailer.shopType || 'grocery',
            phone: retailer.phone || '',
            whatsapp: retailer.whatsapp || '',
            address: retailer.address || '',
            nid: retailer.nid || '',
            tradeLicense: retailer.tradeLicense || '',
        });
    }, [retailer]);

    const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.shopName.trim() || !form.ownerName.trim() || !form.phone.trim() || !form.address.trim()) {
            toast.error('Shop name, owner name, phone and address are required');
            return;
        }
        try {
            await updateMyRetailer({
                shopName: form.shopName.trim(),
                ownerName: form.ownerName.trim(),
                shopType: form.shopType,
                phone: form.phone.trim(),
                whatsapp: form.whatsapp.trim(),
                address: form.address.trim(),
                nid: form.nid.trim(),
                tradeLicense: form.tradeLicense.trim(),
            }).unwrap();
            toast.success('Shop details updated');
        } catch (err) {
            toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not save your changes');
        }
    };

    if (!allowed) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                    <LuLockKeyhole size={26} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-2">Retailer access only</h1>
                <p className="text-sm text-gray-500 mb-6">Register your shop to manage its details here.</p>
                <Link href="/join/retailer" className="inline-block px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
                    Register my shop
                </Link>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-3xl">
                <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            </div>
        );
    }

    if (error || !retailer) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
                    <LuStore size={26} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-2">No shop on file</h1>
                <p className="text-sm text-gray-500 mb-6">
                    {(error as { data?: { message?: string } })?.data?.message
                        || 'We could not find a shop registered to your account.'}
                </p>
                <Link href="/join/retailer" className="inline-block px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
                    Register my shop
                </Link>
            </div>
        );
    }

    const status = retailer.status || 'pending';
    const area = [nameOf(retailer.upazila), nameOf(retailer.district), nameOf(retailer.division)]
        .filter(Boolean)
        .join(', ');

    return (
        <div className="space-y-4 max-w-3xl">
            {/* Terms the owner controls */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <LuShieldCheck size={16} className="text-gray-400" />
                    <h2 className="text-sm font-bold text-gray-900">Verification &amp; credit terms</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Shop status</p>
                        <span className={`inline-flex px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize ${STATUS_TONE[status] || STATUS_TONE.pending}`}>
                            {status}
                        </span>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Credit limit</p>
                        <p className="text-sm font-bold text-gray-900">{taka(retailer.creditLimit)}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Credit used</p>
                        <p className="text-sm font-bold text-gray-900">{taka(retailer.creditUsed)}</p>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50 flex items-start gap-2">
                    <LuLock size={13} className="shrink-0 mt-0.5" />
                    Status and credit terms are set by the marketplace owner and cannot be edited here.
                    Ask your dealer if your limit needs to change.
                </p>
            </div>

            {/* Territory — fixed at registration */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                    <LuMapPin size={16} className="text-gray-400" />
                    <h2 className="text-sm font-bold text-gray-900">Shop area</h2>
                </div>
                <div className={readonlyCls}>{area || 'Not set'}</div>
                <p className="text-xs text-gray-400 mt-2">
                    Your area decides which dealer serves you, so it is fixed after registration. Contact support to move a shop.
                </p>
            </div>

            {/* Editable details */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <LuStore size={16} className="text-gray-400" />
                    <h2 className="text-sm font-bold text-gray-900">Shop details</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls} htmlFor="shopName">Shop name <span className="text-red-500">*</span></label>
                        <input id="shopName" className={inputCls} value={form.shopName} onChange={(e) => set('shopName', e.target.value)} placeholder="Rahman General Store" />
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="ownerName">Owner name <span className="text-red-500">*</span></label>
                        <input id="ownerName" className={inputCls} value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} placeholder="Abdur Rahman" />
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="shopType">Shop type</label>
                        <select id="shopType" className={inputCls} value={form.shopType} onChange={(e) => set('shopType', e.target.value)}>
                            {SHOP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="phone">Phone <span className="text-red-500">*</span></label>
                        <input id="phone" className={inputCls} inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01XXXXXXXXX" />
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="whatsapp">WhatsApp</label>
                        <input id="whatsapp" className={inputCls} inputMode="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="01XXXXXXXXX" />
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="nid">NID number</label>
                        <input id="nid" className={inputCls} value={form.nid} onChange={(e) => set('nid', e.target.value)} placeholder="Optional" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={labelCls} htmlFor="tradeLicense">Trade licence number</label>
                        <input id="tradeLicense" className={inputCls} value={form.tradeLicense} onChange={(e) => set('tradeLicense', e.target.value)} placeholder="Optional" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={labelCls} htmlFor="address">Shop address <span className="text-red-500">*</span></label>
                        <textarea id="address" rows={3} className={`${inputCls} resize-y`} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Road, market name, landmark" />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
                    >
                        {isSaving && <LuLoaderCircle size={16} className="animate-spin" />}
                        {isSaving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
