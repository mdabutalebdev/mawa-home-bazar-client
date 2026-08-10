"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuChevronRight, LuMapPin, LuMapPinned, LuPhone, LuTruck, LuStore,
    LuCopy, LuHandshake, LuSearchX, LuUsers,
} from 'react-icons/lu';
import { BsWhatsapp } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import AreaSelect, { AreaValue } from '@/components/shared/AreaSelect';
import { useGetPublicDealersQuery } from '@/redux/api/dealerApi';
import { useGetGeoCoverageQuery } from '@/redux/api/geoApi';
import { useAppSelector } from '@/redux';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

/* ─── Types (public projection only — see dealer.service PUBLIC_FIELDS) ─── */
interface PopulatedArea {
    _id: string;
    name: string;
    bnName?: string;
    slug?: string;
}

interface PublicDealer {
    _id: string;
    name: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    homeDelivery?: boolean;
    upazila?: PopulatedArea | string | null;
}

interface DivisionCoverage {
    divisionId: string;
    name: string;
    bnName?: string;
    total: number;
    covered: number;
}

interface Coverage {
    total: number;
    covered: number;
    homeDelivery: number;
    byDivision: DivisionCoverage[];
}

/* ─── Helpers ─── */

/**
 * wa.me only accepts the full international form. Dealers type their number
 * however they like (`01712-345678`, `+880 1712 345678`), so everything that is
 * not a digit goes, the trunk `0` is dropped and the 880 country code is put
 * back — matching the normaliser already used on /contact.
 */
const waLink = (raw?: string): string => {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('880')) return `https://wa.me/${digits}`;
    return `https://wa.me/880${digits.replace(/^0+/, '')}`;
};

/** Bangla name when reading Bangla — falls back to English if none is stored. */
const areaName = (area: PublicDealer['upazila'], bangla = false): string => {
    if (!area || typeof area !== 'object') return '';
    return bangla && area.bnName ? area.bnName : area.name;
};

const percent = (part: number, whole: number): number =>
    whole > 0 ? Math.round((part / whole) * 100) : 0;

/* ─── Skeleton ─── */
const DealerSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100" />
            <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded mb-2" />
        <div className="h-3 w-2/3 bg-gray-100 rounded mb-5" />
        <div className="flex gap-2">
            <div className="h-11 flex-1 bg-gray-100 rounded-xl" />
            <div className="h-11 flex-1 bg-gray-100 rounded-xl" />
        </div>
    </div>
);

/* ─── Page ─── */
export default function DealersPage() {
    const { isAuthenticated } = useAppSelector(s => s.auth);
    const { t, lang } = useLanguage();
    const bangla = lang === 'bn';
    const [area, setArea] = useState<AreaValue>({});

    const { data: dealerRes, isLoading, isFetching } = useGetPublicDealersQuery({
        upazila: area.upazila,
        district: area.district,
    });
    const { data: coverageRes, isLoading: coverageLoading } = useGetGeoCoverageQuery(undefined);

    const dealers: PublicDealer[] = dealerRes?.data || [];
    const coverage: Coverage | undefined = coverageRes?.data;
    const divisions: DivisionCoverage[] = coverage?.byDivision || [];

    const hasArea = Boolean(area.upazila || area.district);
    const areaLabel = area.upazilaName || area.districtName || '';
    const joinHref = isAuthenticated ? '/join/dealer' : '/login?redirect=/join/dealer';

    const copyNumber = async (number: string) => {
        try {
            await navigator.clipboard.writeText(number);
            toast.success(t('dealers.numberCopied'));
        } catch {
            toast.error(t('dealers.copyFailed'));
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">

            {/* ══════════ HERO ══════════ */}
            <div className="relative overflow-hidden border-b border-gray-100 bg-white">
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(60% 40% at 85% 0%, rgba(var(--color-primary-rgb),0.10), transparent 70%),' +
                            'radial-gradient(45% 35% at 0% 20%, rgba(var(--color-primary-rgb),0.06), transparent 70%)',
                    }}
                />
                <div className="container relative py-8 sm:py-12">
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-3">
                        <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">{t('common.home')}</Link>
                        <LuChevronRight size={11} />
                        <span className="text-gray-600 font-medium">{t('dealers.breadcrumb')}</span>
                    </div>

                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[rgba(var(--color-primary-rgb),0.08)] text-[var(--color-primary)]">
                            <LuHandshake size={13} /> {t('dealers.badge')}
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-3">
                            {t('dealers.title')}
                        </h1>
                        <p className="text-sm sm:text-[15px] text-gray-500 leading-relaxed mt-2">
                            {t('dealers.subtitle')}
                        </p>
                    </div>

                    {/* Area picker */}
                    <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 max-w-3xl">
                        <AreaSelect
                            label={t('dealers.chooseArea')}
                            value={area}
                            onChange={setArea}
                            bangla={bangla}
                        />
                        {hasArea && (
                            <button
                                type="button"
                                onClick={() => setArea({})}
                                className="mt-3 text-xs font-semibold text-gray-400 hover:text-[var(--color-primary)] transition-colors min-h-[36px]"
                            >
                                {t('dealers.showAll')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container py-6 sm:py-8 space-y-6 sm:space-y-8">

                {/* ══════════ COVERAGE STRIP ══════════ */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    {coverageLoading ? (
                        <div className="animate-pulse">
                            <div className="h-5 w-56 bg-gray-200 rounded mb-4" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i}>
                                        <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                                        <div className="h-2 w-full bg-gray-100 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : coverage ? (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[rgba(var(--color-primary-rgb),0.08)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                                        <LuMapPinned size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[15px] sm:text-base font-extrabold text-gray-900 leading-tight">
                                            {coverage.covered}{t('dealers.coverageMid')}{coverage.total}{t('dealers.coverageSuffix')}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {t('dealers.percentPrefix')}{percent(coverage.covered, coverage.total)}{t('dealers.percentSuffix')}
                                            {coverage.homeDelivery > 0 && ` · ${coverage.homeDelivery}${t('dealers.withHomeDelivery')}`}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={joinHref}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl border border-[rgba(var(--color-primary-rgb),0.25)] text-[var(--color-primary)] text-sm font-bold hover:bg-[rgba(var(--color-primary-rgb),0.06)] transition-colors"
                                >
                                    <LuUsers size={15} /> {t('dealers.becomeDealer')}
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                                {divisions.map((d) => {
                                    const pct = percent(d.covered, d.total);
                                    return (
                                        <div key={d.divisionId}>
                                            <div className="flex items-baseline justify-between mb-1.5">
                                                <span className="text-xs font-bold text-gray-700">
                                                    {bangla && d.bnName ? d.bnName : d.name}
                                                </span>
                                                <span className="text-[11px] text-gray-400 font-medium">
                                                    {d.covered}/{d.total}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-2">
                            {t('dealers.coverageUnavailable')}
                        </p>
                    )}
                </section>

                {/* ══════════ RESULTS ══════════ */}
                <section>
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                            {hasArea && areaLabel
                                ? `${t('dealers.inAreaPrefix')}${areaLabel}${t('dealers.inAreaSuffix')}`
                                : t('dealers.allDealers')}
                        </h2>
                        {!isLoading && dealers.length > 0 && (
                            <span className="text-xs font-semibold text-gray-400 flex-shrink-0">
                                {dealers.length} {dealers.length === 1 ? t('dealers.countOne') : t('dealers.countMany')}
                            </span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => <DealerSkeleton key={i} />)}
                        </div>
                    ) : dealers.length === 0 ? (
                        /* ─── Empty: this is a sales pitch, not an error ─── */
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.07)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                                <LuSearchX size={28} />
                            </div>
                            <h3 className="text-base sm:text-lg font-extrabold text-gray-800">
                                {hasArea ? t('dealers.emptyAreaTitle') : t('dealers.emptyTitle')}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed mt-2 max-w-md mx-auto">
                                {hasArea
                                    ? `${t('dealers.emptyAreaTextPrefix')}${areaLabel || t('dealers.thisArea')}${t('dealers.emptyAreaTextSuffix')}`
                                    : t('dealers.emptyText')}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                                <Link
                                    href={joinHref}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold shadow-md shadow-[rgba(var(--color-primary-rgb),0.25)] hover:bg-[var(--color-primary-dark)] transition-colors"
                                >
                                    <LuHandshake size={16} /> {t('dealers.applyToBeDealer')}
                                </Link>
                                {hasArea && (
                                    <button
                                        type="button"
                                        onClick={() => setArea({})}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 min-h-[48px] rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
                                    >
                                        {t('dealers.seeOtherAreas')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                            {dealers.map((dealer) => {
                                const upazila = areaName(dealer.upazila, bangla);
                                const whatsapp = waLink(dealer.whatsapp);
                                return (
                                    <article
                                        key={dealer._id}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col hover:border-[rgba(var(--color-primary-rgb),0.3)] transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-[rgba(var(--color-primary-rgb),0.08)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                                                <LuStore size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-[15px] font-extrabold text-gray-900 leading-snug break-words">
                                                    {dealer.name}
                                                </h3>
                                                {upazila && (
                                                    <p className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] mt-1">
                                                        <LuMapPin size={12} /> {upazila}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {dealer.address && (
                                            <p className="text-[13px] text-gray-500 leading-relaxed mt-3">
                                                {dealer.address}
                                            </p>
                                        )}

                                        {dealer.homeDelivery && (
                                            <span className="self-start inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg bg-[rgba(var(--color-primary-rgb),0.08)] text-[var(--color-primary)] text-[11px] font-bold">
                                                <LuTruck size={12} /> {t('dealers.homeDelivery')}
                                            </span>
                                        )}

                                        {dealer.phone && (
                                            <button
                                                type="button"
                                                onClick={() => copyNumber(dealer.phone as string)}
                                                className="self-start inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors min-h-[36px]"
                                            >
                                                <LuCopy size={12} /> {dealer.phone}
                                            </button>
                                        )}

                                        {/* Buttons sit at the card bottom so ragged card heights stay tidy */}
                                        <div className="flex gap-2 mt-auto pt-4">
                                            {dealer.phone && (
                                                <a
                                                    href={`tel:${dealer.phone}`}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                                                >
                                                    <LuPhone size={15} /> {t('dealers.call')}
                                                </a>
                                            )}
                                            {whatsapp && (
                                                <a
                                                    href={whatsapp}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
                                                >
                                                    <BsWhatsapp size={15} className="text-[#25D366]" /> {t('common.whatsapp')}
                                                </a>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ══════════ JOIN CTA ══════════ */}
                {dealers.length > 0 && (
                    <section className="rounded-2xl border border-[rgba(var(--color-primary-rgb),0.18)] bg-[rgba(var(--color-primary-rgb),0.04)] p-6 sm:p-8 text-center">
                        <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                            {t('dealers.ctaTitle')}
                        </h2>
                        <p className="text-sm text-gray-500 leading-relaxed mt-2 max-w-lg mx-auto">
                            {t('dealers.ctaText')}
                        </p>
                        <Link
                            href={joinHref}
                            className="inline-flex items-center justify-center gap-2 mt-5 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold shadow-md shadow-[rgba(var(--color-primary-rgb),0.25)] hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            <LuHandshake size={16} /> {t('dealers.becomeDealer')}
                        </Link>
                    </section>
                )}
            </div>
        </div>
    );
}
