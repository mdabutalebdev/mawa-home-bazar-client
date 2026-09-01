"use client";

import React from 'react';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';

/**
 * Stats bar — a horizontal row of highlight tiles ("2,00,000+ resellers,
 * 10,000+ products, 100K+ downloads, 24/7 support"). Sits directly under the
 * hero carousel and is fully editable from the admin panel.
 */
const StatsBar: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const { lang } = useLanguage();
    const stats = data?.data?.statsBar;

    if (!stats || stats.enabled === false) return null;

    const items = (stats.items || [])
        .filter((it: any) => it.active !== false && (it.value || it.label))
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    if (items.length === 0) return null;

    return (
        <section aria-label="Highlights" className="w-full">
            <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div
                    className="grid gap-2 sm:gap-3"
                    style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` }}
                >
                    {items.map((it: any, i: number) => (
                        <div
                            key={i}
                            className="relative overflow-hidden rounded-xl px-3 py-3 sm:px-5 sm:py-4 text-center shadow-sm ring-1 ring-black/5"
                            style={{
                                background:
                                    'linear-gradient(135deg, #FFE68A 0%, #FFC93C 55%, #FFB300 100%)',
                            }}
                        >
                            <span
                                className="pointer-events-none absolute -top-8 -right-6 h-24 w-24 rounded-full opacity-30"
                                style={{ background: 'radial-gradient(closest-side, #ffffff 0%, transparent 70%)' }}
                            />
                            <div className="relative">
                                <div className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-none" style={{ color: 'var(--color-primary)' }}>
                                    {it.icon ? <span className="mr-1">{it.icon}</span> : null}
                                    {it.value}
                                </div>
                                <div className="mt-1 text-[11px] sm:text-sm font-semibold text-gray-800">
                                    {pickText(it.label, lang)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsBar;
