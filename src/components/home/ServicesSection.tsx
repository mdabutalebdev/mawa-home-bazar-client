"use client";

import React from 'react';
import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';
import ContentIcon from '@/components/shared/ContentIcon';

const MAX_ITEMS = 16;

const ServicesSection: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const { lang } = useLanguage();
    const isBn = lang === 'bn';
    const s = data?.data?.servicesSection;

    if (!s || s.enabled === false) return null;

    const items = (s.items || [])
        .filter((it: any) => it.active !== false && (it.image || pickText(it.title, lang) || it.icon))
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .slice(0, MAX_ITEMS);

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

                {/* Two full-width columns on every screen. Cards stay wide; only
                    the image height is kept short (see aspect below). Each opens
                    the request form. */}
                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    {items.map((it: any, i: number) => {
                        const title = pickText(it.title, lang);
                        const description = pickText(it.description, lang);
                        const image: string = it.image || '';

                        return (
                            <Link
                                key={i}
                                href={`/service-request?service=${i}`}
                                className="group block rounded-2xl bg-white border border-gray-200 overflow-hidden hover:border-[var(--color-primary)]/40 transition-colors"
                            >
                                {/* Image / branded fallback — wide & short (height ≈ 43% of width). */}
                                <div className="relative aspect-[21/9] bg-slate-50 overflow-hidden">
                                    {image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={image}
                                            alt={title || 'Service'}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, var(--color-primary-lightest) 100%)' }}
                                        >
                                            <ContentIcon icon={it.icon} index={i} size={54} iconSize={26} radius={14} />
                                        </div>
                                    )}
                                    {/* Hover arrow chip */}
                                    <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-[var(--color-primary)] opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
                                        <LuArrowRight size={16} />
                                    </span>
                                </div>

                                {/* Optional caption — an image-only card shows just a thin request bar */}
                                {(title || description) ? (
                                    <div className="p-3 sm:p-4">
                                        {title && <h3 className="text-[13px] sm:text-base font-bold text-gray-900 leading-tight">{title}</h3>}
                                        {description && (
                                            <p className="mt-1 text-[11px] sm:text-sm text-gray-500 leading-snug line-clamp-2">{description}</p>
                                        )}
                                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[var(--color-primary)]">
                                            {isBn ? 'রিকোয়েস্ট করুন' : 'Request now'} <LuArrowRight size={13} />
                                        </span>
                                    </div>
                                ) : (
                                    <div className="px-3 py-2.5 text-center text-[11px] sm:text-xs font-bold text-[var(--color-primary)]">
                                        {isBn ? 'রিকোয়েস্ট করুন →' : 'Request now →'}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;
