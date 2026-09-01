"use client";

import React from 'react';
import Link from 'next/link';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';

const CategoryShowcaseSection: React.FC = () => {
    const { data: site } = useGetSiteContentQuery(undefined);
    const { lang } = useLanguage();
    const s = site?.data?.categoryShowcaseSection;
    const { data: cats } = useGetCategoriesQuery(
        s?.onlyHome ? { home: true } : {},
    );

    if (!s || s.enabled === false) return null;

    const list = (cats?.data || []).filter((c: any) => !c.parent);
    const showCount = Number(s.showCount) > 0 ? Number(s.showCount) : list.length;
    const visible = list.slice(0, showCount);

    if (visible.length === 0) return null;

    return (
        <section className="w-full bg-white/60">
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <header className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        {pickText(s.title, lang)}
                    </h2>
                    {pickText(s.subtitle, lang) && (
                        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                            {pickText(s.subtitle, lang)}
                        </p>
                    )}
                </header>

                <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
                    {visible.map((c: any) => (
                        <Link
                            key={c._id}
                            href={`/products?category=${c._id}`}
                            className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-[12px] sm:text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)]"
                        >
                            {c.icon && c.icon.length <= 4 && <span className="text-base leading-none">{c.icon}</span>}
                            <span>{c.name}</span>
                        </Link>
                    ))}
                </div>

                {list.length > visible.length && (
                    <div className="mt-6 flex justify-center">
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 px-5 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all"
                        >
                            {lang === 'bn' ? 'সব ক্যাটেগরি দেখুন' : 'View All Categories'} <span aria-hidden>→</span>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CategoryShowcaseSection;
