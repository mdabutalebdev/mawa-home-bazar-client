"use client";

import React from 'react';
import Link from 'next/link';
import { LuArrowRight, LuBadgeCheck } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';
import Logo from '@/components/shared/Logo';

/**
 * About — a professional two-column band: content on the left (eyebrow, title,
 * paragraph, CTA) and a framed image on the right. Everything is admin-managed
 * from Site Content → About Section (title, description, image, button + link).
 * When no image is uploaded yet, a clean branded panel stands in so the layout
 * never looks broken.
 */
const AboutSection: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const { lang } = useLanguage();
    const isBn = lang === 'bn';
    const s = data?.data?.aboutSection;

    if (!s || s.enabled === false) return null;

    const title = pickText(s.title, lang);
    const description = pickText(s.description, lang);
    const ctaLabel = pickText(s.ctaLabel, lang);
    if (!title && !description) return null;

    const imageUrl: string = s.imageUrl || '';

    return (
        <section className="w-full">
            <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
                <div className="grid gap-8 lg:gap-14 md:grid-cols-2 items-center">

                    {/* ── Left: content ── */}
                    <div>
                        <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] mb-4"
                            style={{ background: 'var(--color-primary-lightest)', color: 'var(--color-primary)' }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
                            {isBn ? 'আমরা কারা' : 'Who We Are'}
                        </span>

                        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-gray-900 tracking-tight leading-tight">
                            {title}
                        </h2>

                        <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                            {description}
                        </p>

                        {ctaLabel && (
                            <Link
                                href={s.ctaHref || '/about'}
                                className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                style={{ background: 'var(--color-primary)' }}
                            >
                                {ctaLabel}
                                <LuArrowRight size={17} />
                            </Link>
                        )}
                    </div>

                    {/* ── Right: framed image / branded visual ── */}
                    <div className="relative">
                        {/* soft offset accent behind the frame */}
                        <span
                            aria-hidden
                            className="absolute -inset-3 sm:-inset-4 rounded-3xl"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary-lightest), transparent 70%)' }}
                        />
                        <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 aspect-[4/3] bg-white">
                            {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imageUrl} alt={title || 'About us'} className="w-full h-full object-cover" />
                            ) : (
                                <div
                                    className="w-full h-full flex flex-col items-center justify-center gap-3 relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, var(--color-primary-lightest) 100%)' }}
                                >
                                    <span aria-hidden className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }} />
                                    <span aria-hidden className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-25" style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }} />
                                    <Logo imgClassName="h-16 sm:h-20 relative" />
                                    <span className="relative text-[11px] font-semibold text-gray-500">
                                        {isBn ? 'বিশ্বস্ত অনলাইন মার্কেটপ্লেস' : 'Trusted online marketplace'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* floating trust badge */}
                        <div className="absolute -bottom-3 left-4 sm:left-6 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 shadow-lg ring-1 ring-black/5">
                            <LuBadgeCheck size={18} style={{ color: 'var(--color-primary)' }} />
                            <span className="text-xs font-bold text-gray-800">
                                {isBn ? 'ভেরিফাইড প্ল্যাটফর্ম' : 'Verified Platform'}
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default AboutSection;
