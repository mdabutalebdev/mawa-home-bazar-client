"use client";

import React from 'react';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';
import ContentIcon from '@/components/shared/ContentIcon';

const FeaturesSection: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const { lang } = useLanguage();
    const s = data?.data?.featuresSection;

    if (!s || s.enabled === false) return null;

    const items = (s.items || [])
        .filter((it: any) => it.active !== false && (pickText(it.title, lang) || pickText(it.description, lang)))
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    if (items.length === 0) return null;

    return (
        <section className="w-full">
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <header className="text-center mb-6 sm:mb-10">
                    <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        {pickText(s.title, lang)}
                    </h2>
                    {pickText(s.subtitle, lang) && (
                        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                            {pickText(s.subtitle, lang)}
                        </p>
                    )}
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {items.map((it: any, i: number) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-white border border-gray-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                        >
                            <ContentIcon icon={it.icon} index={i} size={52} iconSize={26} radius={14} className="mb-3" />
                            <h3 className="text-base font-bold text-gray-900">{pickText(it.title, lang)}</h3>
                            {pickText(it.description, lang) && (
                                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
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

export default FeaturesSection;
