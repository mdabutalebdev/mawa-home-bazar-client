"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuStore,
    LuSearch,
    LuPhone,
    LuMessageCircle,
    LuMapPin,
    LuUserRound,
    LuShieldCheck,
    LuChevronRight,
    LuTriangleAlert,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetMyDealerQuery } from '@/redux/api/dealerApi';
import { useGetRetailersByUpazilaQuery } from '@/redux/api/retailerApi';

const telHref = (phone?: string) => `tel:${(phone || '').replace(/[^\d+]/g, '')}`;

/** wa.me needs a bare international number: strip symbols, drop the leading 0. */
const waHref = (phone?: string) => {
    let d = (phone || '').replace(/\D/g, '');
    if (!d) return '';
    if (!d.startsWith('880')) d = `880${d.replace(/^0+/, '')}`;
    return `https://wa.me/${d}`;
};

const SHOP_TYPE_LABEL: Record<string, string> = {
    grocery: 'Grocery',
    pharmacy: 'Pharmacy',
    electronics: 'Electronics',
    cosmetics: 'Cosmetics',
    stationery: 'Stationery',
    hardware: 'Hardware',
    other: 'Other',
};

const RoleGate = () => (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
            <LuShieldCheck size={26} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Dealers only</h1>
        <p className="text-sm text-gray-500 mt-2">Only the dealer of an upazila can see the shops in it.</p>
        <Link
            href="/join/dealer"
            className="mt-5 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-all"
        >
            Become a dealer <LuChevronRight size={16} />
        </Link>
    </div>
);

export default function DealerRetailersPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user?.role || '') as string;
    const isDealer = isAuthenticated && role === 'dealer';

    const [search, setSearch] = useState('');

    const { data: dealerRes, isLoading: dealerLoading, error: dealerError } = useGetMyDealerQuery(undefined, { skip: !isDealer });
    const dealer = dealerRes?.data;
    // The profile populates upazila, but fall back to a raw id just in case.
    const upazilaId: string | undefined = dealer?.upazila?._id || dealer?.upazila;

    const { data: shopsRes, isLoading: shopsLoading } = useGetRetailersByUpazilaQuery(upazilaId as string, {
        skip: !isDealer || !upazilaId,
    });

    if (!isDealer) return <RoleGate />;

    const shops: any[] = shopsRes?.data || [];
    const term = search.trim().toLowerCase();
    const visible = term
        ? shops.filter((s) =>
            `${s.shopName || ''} ${s.ownerName || ''} ${s.phone || ''}`.toLowerCase().includes(term))
        : shops;

    const isLoading = dealerLoading || shopsLoading;
    const territory = dealer?.upazila?.name || '';
    const dealerErrorMessage = (dealerError as any)?.data?.message;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My shops</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Retailers trading in {territory ? <span className="font-semibold text-gray-600">{territory}</span> : 'your upazila'}
                    {!isLoading && shops.length > 0 && <span> · {shops.length} shop{shops.length !== 1 ? 's' : ''}</span>}
                </p>
            </div>

            {dealerErrorMessage && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <LuTriangleAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Cannot load your territory</p>
                        <p className="text-xs text-amber-700 mt-0.5">{dealerErrorMessage}</p>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="relative">
                    <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search shop, owner or phone..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Shops */}
            <div className="space-y-3">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
                            <div className="flex gap-3">
                                <div className="w-11 h-11 bg-gray-100 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-40" />
                                    <div className="h-3 bg-gray-100 rounded w-28" />
                                </div>
                            </div>
                            <div className="h-9 bg-gray-50 rounded-xl mt-4" />
                        </div>
                    ))
                ) : visible.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
                        <LuStore size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-lg font-bold text-gray-600 mb-1">
                            {term ? 'No match' : 'No shops yet'}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {term
                                ? 'Try a different shop name, owner or number.'
                                : 'Approved retailers in your upazila will appear here.'}
                        </p>
                    </div>
                ) : (
                    visible.map((shop: any) => (
                        <div key={shop._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                                    <LuStore size={19} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-bold text-gray-900 truncate">{shop.shopName}</p>
                                        <span className="shrink-0 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                                            {SHOP_TYPE_LABEL[shop.shopType] || 'Shop'}
                                        </span>
                                    </div>
                                    <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                        <LuUserRound size={13} className="text-gray-300 shrink-0" />
                                        <span className="truncate">{shop.ownerName}</span>
                                    </p>
                                    {shop.address && (
                                        <p className="flex items-start gap-1.5 text-xs text-gray-400 mt-1">
                                            <LuMapPin size={13} className="text-gray-300 shrink-0 mt-0.5" />
                                            <span className="line-clamp-2">{shop.address}</span>
                                        </p>
                                    )}
                                    {shop.phone && (
                                        <a href={telHref(shop.phone)} className="inline-block text-xs font-semibold text-[var(--color-primary)] mt-1.5 hover:underline">
                                            {shop.phone}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                                {shop.phone ? (
                                    <>
                                        <a
                                            href={telHref(shop.phone)}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-all"
                                        >
                                            <LuPhone size={15} /> Call
                                        </a>
                                        <a
                                            href={waHref(shop.whatsapp || shop.phone)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all"
                                        >
                                            <LuMessageCircle size={15} /> WhatsApp
                                        </a>
                                    </>
                                ) : (
                                    <p className="text-xs text-gray-400 font-medium">No phone number on file</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
