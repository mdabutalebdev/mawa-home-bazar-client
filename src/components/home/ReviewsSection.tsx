"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { LuChevronLeft, LuChevronRight, LuQuote } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';

interface Review {
    name?: string;
    designation?: string;
    avatar?: string;
    rating?: number;
    text?: string;
    active?: boolean;
    order?: number;
}

const GAP = 16; // matches the `gap-4` track spacing — used for step math.

/** 5-star row — filled amber up to `rating`, the rest a soft grey. */
const Stars: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
        {[0, 1, 2, 3, 4].map((i) => (
            <FaStar key={i} size={13} className={i < rating ? 'text-amber-400' : 'text-slate-200'} />
        ))}
    </div>
);

/** Circular avatar — the uploaded photo, or the person's first initial. */
const Avatar: React.FC<{ name: string; avatar?: string }> = ({ name, avatar }) => {
    const initial = (name || '?').trim().charAt(0).toUpperCase();
    return avatar
        ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatar}
                alt={name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-[var(--color-primary)]/25"
            />
        )
        : (
            <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ring-2 ring-[var(--color-primary)]/25"
                style={{ background: 'var(--color-primary-lightest)', color: 'var(--color-primary)' }}
            >
                {initial}
            </span>
        );
};

const ReviewsSection: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const { lang } = useLanguage();
    const s = data?.data?.reviewsSection;

    const trackRef = useRef<HTMLDivElement>(null);
    const pausedRef = useRef(false);
    const [active, setActive] = useState(0);
    const [steps, setSteps] = useState(1);

    const items: Review[] = (s?.items || [])
        .filter((r: Review) => r.active !== false && (r.text || r.name))
        .sort((a: Review, b: Review) => (a.order ?? 0) - (b.order ?? 0));

    // Measure the live layout: how wide one card+gap is, how many fit per view,
    // and therefore how many scroll "steps" (dots) the carousel has. Recomputed
    // on every use so it always reflects the current breakpoint.
    const measure = useCallback(() => {
        const track = trackRef.current;
        const first = track?.children[0] as HTMLElement | undefined;
        if (!track || !first) return { unit: 1, perView: 1, stepCount: 1 };
        const unit = first.getBoundingClientRect().width + GAP;
        const perView = Math.max(1, Math.round((track.clientWidth + GAP) / unit));
        const stepCount = Math.max(1, track.children.length - perView + 1);
        return { unit, perView, stepCount };
    }, []);

    const goToStep = useCallback((i: number) => {
        const track = trackRef.current;
        if (!track) return;
        const { unit, stepCount } = measure();
        const clamped = ((i % stepCount) + stepCount) % stepCount;
        track.scrollTo({ left: clamped * unit, behavior: 'smooth' });
    }, [measure]);

    // Current step read from the LIVE scroll position — keeps the arrows and
    // autoplay correct even if React state hasn't caught up to the last scroll.
    const currentStep = useCallback(() => {
        const track = trackRef.current;
        if (!track) return 0;
        const { unit, stepCount } = measure();
        return Math.min(stepCount - 1, Math.max(0, Math.round(track.scrollLeft / unit)));
    }, [measure]);

    // Keep the step count in sync with mount / resize / item changes.
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        const sync = () => setSteps(measure().stepCount);
        sync();
        const ro = new ResizeObserver(sync);
        ro.observe(track);
        return () => ro.disconnect();
    }, [measure, items.length]);

    // Highlight the dot for whatever step is currently scrolled into view.
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const { unit, stepCount } = measure();
                setActive(Math.min(stepCount - 1, Math.max(0, Math.round(track.scrollLeft / unit))));
            });
        };
        track.addEventListener('scroll', onScroll, { passive: true });
        return () => { track.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
    }, [measure, items.length]);

    // Gentle autoplay — advances one step every 4.5s, paused while hovered.
    useEffect(() => {
        if (steps <= 1) return;
        const id = setInterval(() => {
            if (pausedRef.current) return;
            const { stepCount } = measure();
            goToStep((currentStep() + 1) % stepCount);
        }, 4500);
        return () => clearInterval(id);
    }, [steps, goToStep, measure, currentStep]);

    if (!s || s.enabled === false || items.length === 0) return null;

    const title = pickText(s.title, lang);
    const subtitle = pickText(s.subtitle, lang);

    return (
        <section className="w-full">
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Header */}
                <header className="text-center mb-6 sm:mb-10 max-w-3xl mx-auto">
                    <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
                    {subtitle && (
                        <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">{subtitle}</p>
                    )}
                </header>

                {/* Carousel */}
                <div
                    className="relative"
                    onMouseEnter={() => { pausedRef.current = true; }}
                    onMouseLeave={() => { pausedRef.current = false; }}
                >
                    <div
                        ref={trackRef}
                        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: 'none', scrollSnapType: 'x proximity' }}
                    >
                        {items.map((r, i) => (
                            <article
                                key={i}
                                className="shrink-0 w-[85%] sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]
                                           rounded-2xl bg-white border border-gray-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]
                                           flex flex-col"
                                style={{ scrollSnapAlign: 'start' }}
                            >
                                {/* Person */}
                                <div className="flex items-center gap-3">
                                    <Avatar name={r.name || ''} avatar={r.avatar} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{r.name || 'Customer'}</p>
                                        <div className="mt-0.5 flex items-center gap-2">
                                            <Stars rating={Math.max(0, Math.min(5, r.rating ?? 5))} />
                                            {r.designation && (
                                                <span className="text-[11px] text-gray-400 truncate">{r.designation}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quote */}
                                <div className="relative mt-4 flex-1">
                                    <LuQuote
                                        size={18}
                                        className="absolute -top-1 left-0 text-[var(--color-primary)]/15 rotate-180"
                                    />
                                    <p className="pl-6 text-[13px] text-gray-600 leading-relaxed">{r.text}</p>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Arrows — shown only when there is something to scroll to */}
                    {steps > 1 && (
                        <>
                            <button
                                type="button"
                                aria-label="Previous review"
                                onClick={() => goToStep(currentStep() - 1)}
                                className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition"
                            >
                                <LuChevronLeft size={18} />
                            </button>
                            <button
                                type="button"
                                aria-label="Next review"
                                onClick={() => goToStep(currentStep() + 1)}
                                className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition"
                            >
                                <LuChevronRight size={18} />
                            </button>
                        </>
                    )}
                </div>

                {/* Dots — one per scroll step */}
                {steps > 1 && (
                    <div className="mt-5 flex items-center justify-center gap-1.5">
                        {Array.from({ length: steps }).map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Go to review group ${i + 1}`}
                                onClick={() => goToStep(i)}
                                className="h-2 rounded-full transition-all"
                                style={{
                                    width: i === active ? 20 : 8,
                                    background: i === active ? 'var(--color-primary)' : '#d1d5db',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ReviewsSection;
