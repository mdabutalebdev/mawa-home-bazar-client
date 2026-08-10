"use client";

import React from 'react';
import Link from 'next/link';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';

/**
 * Mid-page promo banner — sits between "Popular Products" and "New Arrivals".
 *
 * Fully driven by the database (Dashboard → Site Content → 🖼️ Hero Slides →
 * "Homepage Promo Banner"): image, link, optional headline/sub-text/button,
 * which side the copy sits on and whether the scrim is drawn. Blank image or
 * `active: false` renders nothing at all, so the section simply disappears
 * rather than leaving a gap.
 *
 * The frame is a FIXED height at each breakpoint and the artwork is
 * cover-fitted into it, matching HeroSection — so swapping in a differently
 * proportioned image never changes the page layout.
 */
const STAGE_HEIGHT = 'h-[150px] sm:h-[210px] md:h-[270px] lg:h-[320px]';

const PromoBanner: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const b = data?.data?.homeBanner;

    if (!b?.imageUrl || b.active === false) return null;

    const hasText = !!(b.title || b.subtitle || b.ctaLabel);
    const align = b.align || 'left';
    const dark = b.textTone === 'dark';

    return (
        <section className="w-full" aria-label="Promotional banner">
            <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
                <Link
                    href={b.link || '/products'}
                    aria-label={b.title || 'Shop now'}
                    className={`group relative block w-full overflow-hidden rounded-md bg-slate-100 shadow-[0_14px_44px_-22px_rgba(15,23,42,0.4)] ring-1 ring-black/5 ${STAGE_HEIGHT}`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={b.imageUrl}
                        alt={b.title || ''}
                        draggable={false}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />

                    {hasText && b.scrim !== false && (
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background:
                                    align === 'right'
                                        ? 'linear-gradient(to left, rgba(var(--color-primary-rgb),0.94) 0%, rgba(var(--color-primary-rgb),0.90) 42%, rgba(var(--color-primary-rgb),0.55) 58%, rgba(var(--color-primary-rgb),0) 78%)'
                                        : align === 'center'
                                            ? 'linear-gradient(to top, rgba(var(--color-primary-rgb),0.88) 0%, rgba(var(--color-primary-rgb),0.60) 55%, rgba(var(--color-primary-rgb),0) 100%)'
                                            : 'linear-gradient(to right, rgba(var(--color-primary-rgb),0.94) 0%, rgba(var(--color-primary-rgb),0.90) 42%, rgba(var(--color-primary-rgb),0.55) 58%, rgba(var(--color-primary-rgb),0) 78%)',
                            }}
                        />
                    )}

                    {hasText && (
                        <div
                            className={`pointer-events-none absolute inset-0 flex items-center px-[6%] sm:px-[7%] ${
                                align === 'right' ? 'justify-end text-right'
                                    : align === 'center' ? 'justify-center text-center'
                                        : 'justify-start text-left'
                            }`}
                        >
                            <div className={align === 'center' ? 'max-w-[70%]' : 'max-w-[38%]'}>
                                {b.title && (
                                    <h2 className={`text-[16px] font-bold leading-[1.2] tracking-tight drop-shadow-sm sm:text-[22px] md:text-[30px] lg:text-[36px] ${dark ? 'text-slate-900' : 'text-white'}`}>
                                        {b.title}
                                    </h2>
                                )}
                                {b.subtitle && (
                                    <p className={`mt-1.5 text-[10px] leading-snug sm:mt-2 sm:text-[12px] md:text-[14px] lg:text-[16px] ${dark ? 'text-slate-700' : 'text-white/85'}`}>
                                        {b.subtitle}
                                    </p>
                                )}
                                {b.ctaLabel && (
                                    <span className={`mt-2.5 inline-flex items-center rounded-full px-3.5 py-1.5 text-[10px] font-bold shadow-lg sm:mt-3.5 sm:px-5 sm:py-2 sm:text-[12px] md:text-[13px] ${dark ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-[var(--color-primary)]'}`}>
                                        {b.ctaLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </Link>
            </div>
        </section>
    );
};

export default PromoBanner;
