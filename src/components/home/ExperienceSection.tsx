"use client";

import React from 'react';
import { LuTrophy } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';
import ContentIcon from '@/components/shared/ContentIcon';

/**
 * Experience — a centered grid of achievement cards, each with a colored icon
 * tile on top and the achievement text below. Deliberately shares the card
 * language of the Features / Services sections so the homepage reads as one
 * consistent system.
 */
const ExperienceSection: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const { lang } = useLanguage();
    const s = data?.data?.experienceSection;

    if (!s || s.enabled === false) return null;

    const items = (s.items || [])
        .filter((it: any) => it.active !== false && pickText(it.text, lang))
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    const title = pickText(s.title, lang);
    const subtitle = pickText(s.subtitle, lang);
    if (!title && !subtitle && items.length === 0) return null;

    return (
        <section className="w-full">
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <header className="text-center mb-6 sm:mb-10 max-w-3xl mx-auto">
                    <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
                    {subtitle && (
                        <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">{subtitle}</p>
                    )}
                </header>

                {items.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        {items.map((it: any, i: number) => (
                            <div
                                key={i}
                                className="flex flex-col items-center text-center rounded-2xl bg-white border border-gray-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                            >
                                <ContentIcon
                                    icon={it.icon}
                                    index={i}
                                    size={52}
                                    iconSize={26}
                                    radius={14}
                                    className="mb-3"
                                    fallbackIcon={LuTrophy}
                                />
                                <p className="text-sm text-gray-700 leading-relaxed">{pickText(it.text, lang)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ExperienceSection;
