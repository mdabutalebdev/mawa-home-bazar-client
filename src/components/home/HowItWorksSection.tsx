"use client";

import React from 'react';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';

/**
 * How-it-works — a numbered step deck. Each card carries a big navy circle
 * with the step number, then the title and a short paragraph. Sits on the
 * cream page as a run of clean white cards.
 */
const HowItWorksSection: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const { lang } = useLanguage();
    const s = data?.data?.howItWorksSection;

    if (!s || s.enabled === false) return null;

    const steps = (s.steps || [])
        .filter((it: any) => it.active !== false && (it.step || pickText(it.title, lang) || pickText(it.description, lang)))
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    if (steps.length === 0) return null;

    return (
        <section className="w-full">
            <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
                <header className="text-center mb-8 sm:mb-10">
                    <span
                        className="inline-block text-[11px] font-bold tracking-[0.22em] uppercase mb-2"
                        style={{ color: 'var(--color-primary)' }}
                    >
                        ● {lang === 'bn' ? 'কীভাবে কাজ করে' : 'How It Works'}
                    </span>
                    <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        {pickText(s.title, lang)}
                    </h2>
                    {pickText(s.subtitle, lang) && (
                        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                            {pickText(s.subtitle, lang)}
                        </p>
                    )}
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {steps.map((it: any, i: number) => (
                        <div
                            key={i}
                            className="relative rounded-2xl bg-white border border-gray-200 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                        >
                            {/* Step chip — top-right, so it reads as a stamp on the card. */}
                            <span
                                className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-white"
                                style={{ background: 'var(--color-primary)' }}
                            >
                                {it.step || String(i + 1)}
                            </span>

                            {pickText(it.title, lang) && (
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 pr-12">
                                    {pickText(it.title, lang)}
                                </h3>
                            )}
                            {pickText(it.description, lang) && (
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {pickText(it.description, lang)}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
