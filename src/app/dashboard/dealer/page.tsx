"use client";

import React from 'react';
import Link from 'next/link';
import {
    LuShoppingCart,
    LuPhoneCall,
    LuCircleCheck,
    LuWallet,
    LuHandCoins,
    LuStore,
    LuMapPin,
    LuPercent,
    LuBike,
    LuChevronRight,
    LuShieldCheck,
    LuTriangleAlert,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetDealerOrderStatsQuery, useGetMyDealerQuery } from '@/redux/api/dealerApi';

const money = (n: number) => `৳${Number(n || 0).toLocaleString()}`;

const RoleGate = () => (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
            <LuShieldCheck size={26} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Dealers only</h1>
        <p className="text-sm text-gray-500 mt-2">Apply for your upazila to open this dashboard.</p>
        <Link
            href="/join/dealer"
            className="mt-5 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-all"
        >
            Become a dealer <LuChevronRight size={16} />
        </Link>
    </div>
);

export default function DealerOverviewPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user?.role || '') as string;
    const isDealer = isAuthenticated && role === 'dealer';

    const { data: statsRes, isLoading: statsLoading, error: statsError } = useGetDealerOrderStatsQuery(undefined, { skip: !isDealer });
    const { data: dealerRes, isLoading: dealerLoading } = useGetMyDealerQuery(undefined, { skip: !isDealer });

    if (!isDealer) return <RoleGate />;

    const stats = statsRes?.data || {};
    const dealer = dealerRes?.data || {};
    const territory = dealer?.upazila?.name || dealer?.upazila?.bnName || '—';
    const district = dealer?.district?.name || '';
    const commissionRate = stats?.commissionRate ?? dealer?.commissionRate ?? 0;
    const homeDelivery = stats?.homeDelivery ?? dealer?.homeDelivery ?? false;
    const isLoading = statsLoading || dealerLoading;

    // 403 here means the application is still pending / suspended — the order
    // endpoints refuse to answer until the owner approves the territory.
    const blocked = (statsError as any)?.status === 403 || (statsError as any)?.status === 404;
    const blockedMessage = (statsError as any)?.data?.message || 'Your dealer account is not approved yet.';

    const tiles = [
        { label: 'Total orders', value: stats.total || 0, icon: LuShoppingCart, tone: 'text-gray-900', bg: 'bg-gray-100 text-gray-600', href: '/dashboard/dealer/orders' },
        { label: 'Awaiting my call', value: stats.awaitingConfirmation || 0, icon: LuPhoneCall, tone: 'text-amber-600', bg: 'bg-amber-50 text-amber-600', href: '/dashboard/dealer/orders?confirmed=false' },
        { label: 'Delivered', value: stats.delivered || 0, icon: LuCircleCheck, tone: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-600', href: '/dashboard/dealer/orders?status=delivered' },
        { label: 'Sales value', value: money(stats.salesValue), icon: LuWallet, tone: 'text-gray-900', bg: 'bg-sky-50 text-sky-600' },
        { label: 'My commission', value: money(stats.commission), icon: LuHandCoins, tone: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
        { label: 'Shops in my area', value: stats.retailers || 0, icon: LuStore, tone: 'text-gray-900', bg: 'bg-purple-50 text-purple-600', href: '/dashboard/dealer/retailers' },
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Hello, {user?.name?.split(' ')[0] || 'Dealer'}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    Everything happening in your upazila, in one place.
                </p>
            </div>

            {blocked && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <LuTriangleAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Not trading yet</p>
                        <p className="text-xs text-amber-700 mt-0.5">{blockedMessage}</p>
                    </div>
                </div>
            )}

            {/* Territory card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                {dealerLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:divide-x divide-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                                <LuMapPin size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">My territory</p>
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {territory}{district ? `, ${district}` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:pl-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <LuPercent size={18} />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Commission rate</p>
                                <p className="text-sm font-bold text-gray-900">{commissionRate}%</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:pl-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${homeDelivery ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                <LuBike size={18} />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Home delivery</p>
                                <span className={`inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-lg text-[11px] font-bold ${homeDelivery ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${homeDelivery ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                    {homeDelivery ? 'ON' : 'OFF'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {isLoading
                    ? [...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm animate-pulse">
                            <div className="h-9 w-9 bg-gray-100 rounded-xl mb-3" />
                            <div className="h-6 bg-gray-100 rounded w-16 mb-2" />
                            <div className="h-3 bg-gray-50 rounded w-24" />
                        </div>
                    ))
                    : tiles.map((tile) => {
                        const Icon = tile.icon;
                        const body = (
                            <>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tile.bg}`}>
                                    <Icon size={17} />
                                </div>
                                <p className={`text-xl sm:text-2xl font-bold ${tile.tone} leading-tight`}>{tile.value}</p>
                                <p className="text-xs text-gray-400 font-medium mt-1">{tile.label}</p>
                            </>
                        );
                        return tile.href ? (
                            <Link
                                key={tile.label}
                                href={tile.href}
                                className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
                            >
                                {body}
                            </Link>
                        ) : (
                            <div key={tile.label} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                                {body}
                            </div>
                        );
                    })}
            </div>

            {/* Call to action — the queue is where a dealer actually works */}
            <Link
                href="/dashboard/dealer/orders?confirmed=false"
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group"
            >
                <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <LuPhoneCall size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">Orders waiting for my call</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Phone the customer and the company — the company can only ship after that.
                    </p>
                </div>
                <LuChevronRight size={18} className="text-gray-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
        </div>
    );
}
