"use client";

import React from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    LuBuilding2,
    LuHandshake,
    LuStore,
    LuArrowRight,
    LuCheck,
    LuChevronRight,
    LuClipboardList,
    LuShieldCheck,
    LuBadgeCheck,
    LuRocket,
    LuLock,
    LuSparkles,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/dictionary';

type Track = {
    slug: string;
    icon: React.ReactNode;
    titleKey: TranslationKey;
    pitchKey: TranslationKey;
    benefitKeys: TranslationKey[];
    ctaKey: TranslationKey;
};

/* Only the keys live here — the copy is resolved at render so switching the
   language re-labels the cards without remounting anything. */
const TRACKS: Track[] = [
    {
        slug: 'company',
        icon: <LuBuilding2 size={24} />,
        titleKey: 'join.company.title',
        pitchKey: 'join.company.pitch',
        benefitKeys: ['join.company.b1', 'join.company.b2', 'join.company.b3'],
        ctaKey: 'join.company.cta',
    },
    {
        slug: 'dealer',
        icon: <LuHandshake size={24} />,
        titleKey: 'join.dealer.title',
        pitchKey: 'join.dealer.pitch',
        benefitKeys: ['join.dealer.b1', 'join.dealer.b2', 'join.dealer.b3'],
        ctaKey: 'join.dealer.cta',
    },
    {
        slug: 'retailer',
        icon: <LuStore size={24} />,
        titleKey: 'join.retailer.title',
        pitchKey: 'join.retailer.pitch',
        benefitKeys: ['join.retailer.b1', 'join.retailer.b2', 'join.retailer.b3'],
        ctaKey: 'join.retailer.cta',
    },
];

const STEPS: { icon: React.ReactNode; titleKey: TranslationKey; textKey: TranslationKey }[] = [
    { icon: <LuClipboardList size={18} />, titleKey: 'join.step.apply.title', textKey: 'join.step.apply.text' },
    { icon: <LuShieldCheck size={18} />, titleKey: 'join.step.verify.title', textKey: 'join.step.verify.text' },
    { icon: <LuBadgeCheck size={18} />, titleKey: 'join.step.approved.title', textKey: 'join.step.approved.text' },
    { icon: <LuRocket size={18} />, titleKey: 'join.step.trade.title', textKey: 'join.step.trade.text' },
];

export default function JoinPage() {
    const { isAuthenticated, isRestoring, user } = useAppSelector((s) => s.auth);
    const { t } = useLanguage();

    // A saved session is only re-checked after mount, so until it settles every
    // CTA would point at /login — including for people who are already signed in.
    const showSkeleton = isRestoring;

    const hrefFor = (slug: string) =>
        isAuthenticated ? `/join/${slug}` : `/login?redirect=${encodeURIComponent(`/join/${slug}`)}`;

    const handleGuestClick = () => {
        if (!isAuthenticated) toast(t('join.guestToast'), { icon: '🔐' });
    };

    return (
        <div className="bg-white min-h-screen">

            {/* ══════════ HERO ══════════ */}
            <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-[rgba(var(--color-primary-rgb),0.07)] to-white">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[rgba(var(--color-primary-rgb),0.10)]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-28 left-[-10%] h-64 w-64 rounded-full bg-[rgba(var(--color-primary-rgb),0.07)]"
                />

                <div className="container relative z-10 py-10 sm:py-14 text-center">
                    <nav className="flex items-center justify-center gap-1.5 mb-4 text-xs text-gray-400">
                        <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">{t('common.home')}</Link>
                        <LuChevronRight size={12} />
                        <span className="font-medium text-gray-600">{t('nav.join')}</span>
                    </nav>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-primary-rgb),0.10)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                        <LuSparkles size={12} /> {t('join.badge')}
                    </span>

                    <h1 className="mx-auto mt-4 max-w-2xl text-2xl sm:text-4xl font-extrabold leading-tight text-gray-900">
                        {t('join.title')}
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-gray-500">
                        {t('join.subtitle')}
                    </p>

                    {isAuthenticated && user?.name && (
                        <p className="mt-4 text-xs text-gray-400">
                            {t('join.signedInPrefix')}
                            <span className="font-semibold text-gray-600">{user.name}</span>
                            {t('join.signedInSuffix')}
                        </p>
                    )}
                    {!isRestoring && !isAuthenticated && (
                        <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                            <LuLock size={13} /> {t('join.signInNotice')}
                        </p>
                    )}
                </div>
            </section>

            {/* ══════════ TRACK CARDS ══════════ */}
            <section className="container py-10 sm:py-14">
                <div className="mb-6 sm:mb-8 text-center">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('join.chooseTitle')}</h2>
                    <p className="mt-1 text-sm text-gray-500">{t('join.chooseSubtitle')}</p>
                </div>

                {showSkeleton ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 p-5 sm:p-6">
                                <div className="mb-4 h-12 w-12 rounded-xl bg-gray-100" />
                                <div className="mb-3 h-4 w-40 rounded bg-gray-200" />
                                <div className="mb-5 h-3 w-56 rounded bg-gray-100" />
                                <div className="space-y-2.5">
                                    <div className="h-3 w-full rounded bg-gray-100" />
                                    <div className="h-3 w-5/6 rounded bg-gray-100" />
                                    <div className="h-3 w-4/6 rounded bg-gray-100" />
                                </div>
                                <div className="mt-6 h-11 w-full rounded-xl bg-gray-100" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        {TRACKS.map((track) => (
                            <div
                                key={track.slug}
                                className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[rgba(var(--color-primary-rgb),0.35)] hover:shadow-lg"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.10)] text-[var(--color-primary)]">
                                        {track.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900">{t(track.titleKey)}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-gray-500">{t(track.pitchKey)}</p>
                                    </div>
                                </div>

                                <ul className="mt-5 space-y-2.5 border-t border-gray-50 pt-5">
                                    {track.benefitKeys.map((key) => (
                                        <li key={key} className="flex items-start gap-2.5">
                                            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(var(--color-primary-rgb),0.12)] text-[var(--color-primary)]">
                                                <LuCheck size={11} strokeWidth={3} />
                                            </span>
                                            <span className="text-[13px] leading-relaxed text-gray-600">{t(key)}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={hrefFor(track.slug)}
                                    onClick={handleGuestClick}
                                    className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white shadow-md shadow-[rgba(var(--color-primary-rgb),0.25)] transition-all hover:bg-[var(--color-primary-dark)] active:scale-[0.99]"
                                >
                                    {isAuthenticated
                                        ? t(track.ctaKey)
                                        : <><LuLock size={14} /> {t('join.signInToApply')}</>}
                                    <LuArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ══════════ HOW IT WORKS ══════════ */}
            <section className="border-y border-gray-100 bg-gray-50/70">
                <div className="container py-10 sm:py-12">
                    <div className="mb-7 text-center">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('join.how.title')}</h2>
                        <p className="mt-1 text-sm text-gray-500">{t('join.how.subtitle')}</p>
                    </div>

                    <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {STEPS.map((s, i) => (
                            <li
                                key={s.titleKey}
                                className="relative flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-col sm:items-center sm:gap-2 sm:p-5 sm:text-center"
                            >
                                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.10)] text-[var(--color-primary)]">
                                    {s.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900">
                                        <span className="mr-1.5 text-[var(--color-primary)]">{i + 1}.</span>
                                        {t(s.titleKey)}
                                    </p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{t(s.textKey)}</p>
                                </div>

                                {/* Connector only reads as a flow once the steps sit in a row. */}
                                {i < STEPS.length - 1 && (
                                    <LuChevronRight
                                        aria-hidden
                                        size={16}
                                        className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-gray-300 lg:block"
                                    />
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ══════════ FOOT NOTE ══════════ */}
            <section className="container py-10 sm:py-12">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-7 text-center shadow-sm">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('join.help.title')}</h2>
                    <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-gray-500">
                        {t('join.help.text')}
                    </p>
                    <Link
                        href="/contact"
                        className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[rgba(var(--color-primary-rgb),0.35)] px-6 text-sm font-bold text-[var(--color-primary)] transition-all hover:bg-[rgba(var(--color-primary-rgb),0.06)]"
                    >
                        {t('join.help.cta')} <LuArrowRight size={15} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
