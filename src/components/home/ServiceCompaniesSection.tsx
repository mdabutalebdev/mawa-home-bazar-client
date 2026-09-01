"use client";

import React from 'react';
import Link from 'next/link';
import { LuArrowRight, LuBuilding2 } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';

/**
 * "আমাদের কোম্পানি সার্ভিস সমূহ" — admin-managed showcase of partner /
 * service-provider companies. Styled to match the "আমাদের সার্ভিস সমূহ"
 * (ServicesSection) row: a soft warm-tinted band with white horizontal cards,
 * logo/icon on the left, title (+ optional description) in the middle and an
 * arrow chip on the right. Data lives on siteContent.serviceCompaniesSection
 * so the admin can add, reorder and hide items without a deploy.
 */
const MAX_ITEMS = 24;

const ServiceCompaniesSection: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const { lang } = useLanguage();
    const isBn = lang === 'bn';
    const s = data?.data?.serviceCompaniesSection;

    if (!s || s.enabled === false) return null;

    const items = (s.items || [])
        .filter((it: any) => it.active !== false && (it.logo || pickText(it.title, lang)))
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .slice(0, MAX_ITEMS);

    if (items.length === 0) return null;

    return (
        <section
            className="w-full"
            style={{
                // Soft warm band so the row reads as its own section, matching
                // the reference "services" strip.
                background: 'linear-gradient(180deg, #FFF7E6 0%, #FEF3D7 100%)',
            }}
        >
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <header className="text-center mb-6 sm:mb-10">
                    <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        {pickText(s.title, lang) || (isBn ? 'আমাদের কোম্পানি সার্ভিস সমূহ' : 'Our Company Services')}
                    </h2>
                    {pickText(s.subtitle, lang) && (
                        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                            {pickText(s.subtitle, lang)}
                        </p>
                    )}
                </header>

                {/* Horizontal cards: icon/logo left, title (+desc) middle, arrow right.
                    1 col mobile → 2 sm → 3 md → 4 lg, mirroring the services row. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {items.map((it: any, i: number) => {
                        const title = pickText(it.title, lang) || (isBn ? 'কোম্পানি' : 'Company');
                        const description = pickText(it.description, lang);
                        const logo: string = it.logo || '';
                        const href: string = it.link || '';
                        const isClickable = !!href;

                        const Wrapper: any = isClickable ? Link : 'div';
                        const wrapperProps: any = isClickable
                            ? { href, ...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }
                            : {};

                        return (
                            <Wrapper
                                key={i}
                                {...wrapperProps}
                                className={`group flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm px-3.5 py-3.5 sm:px-4 sm:py-4 ${isClickable ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 transition-all cursor-pointer' : ''}`}
                            >
                                {/* Logo / icon bed — fixed square, keeps the row aligned. */}
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#FFF7ED] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {logo ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={logo}
                                            alt={title}
                                            className="w-full h-full object-contain p-1.5"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <LuBuilding2 size={24} className="text-[var(--color-primary)]" />
                                    )}
                                </div>

                                {/* Text block */}
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-[13.5px] sm:text-[15px] font-bold text-gray-900 leading-tight line-clamp-1">
                                        {title}
                                    </h3>
                                    {description && (
                                        <p className="mt-0.5 text-[11px] sm:text-[12px] text-gray-500 leading-snug line-clamp-1">
                                            {description}
                                        </p>
                                    )}
                                </div>

                                {/* Arrow chip — always visible, brand orange, like the reference. */}
                                <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                    <LuArrowRight size={16} />
                                </span>
                            </Wrapper>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ServiceCompaniesSection;
