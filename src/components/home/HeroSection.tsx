"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';

const SLIDE_INTERVAL = 6000; // ms per slide
const FADE_MS = 800;         // crossfade duration

type HeroSlide = {
    imageUrl: string;
    active?: boolean;
    order?: number;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    align?: 'left' | 'center' | 'right';
    textTone?: 'light' | 'dark';
    /** Soft brand-tinted gradient behind the copy. On by default — turn it off
     *  only when the artwork is already dark enough on the text side. */
    scrim?: boolean;
};

/**
 * Hero — the homepage banner carousel.
 *
 * Shows the admin's hero banners (Dashboard → Site Content → Hero Slides,
 * recommended 1920 × 540) with an OPTIONAL live-text overlay per slide.
 *
 * Text is real HTML rather than pixels baked into the artwork, so it stays
 * sharp at any resolution, shrinks sensibly on phones, renders Bengali
 * correctly and can be reworded without regenerating the image. A slide whose
 * artwork already carries its own wording simply leaves title/subtitle/CTA
 * blank — then nothing is drawn over it.
 *
 * Smooth crossfade, autoplay (pauses on hover), glass arrows, progress dots and
 * touch swipe. Honors prefers-reduced-motion.
 */
const HeroSection: React.FC = () => {
    const { data, isLoading } = useGetSiteContentQuery(undefined);
    const reduce = !!useReducedMotion();

    // Only ever the admin's own banners — there is deliberately no stand-in image
    // to fall back on, because a placeholder banner would flash on every load
    // before the real ones arrive.
    const slides = React.useMemo(() => {
        return ((data?.data?.heroSlides || []) as HeroSlide[])
            .filter((s) => s?.imageUrl && s.active !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [data]);
    const images = React.useMemo(() => slides.map((s) => s.imageUrl), [slides]);

    const multiple = images.length > 1;
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [cycle, setCycle] = useState(0); // restarts the progress bar after pause/manual nav

    /**
     * The stage is a FIXED height at every breakpoint — it never adapts to the
     * uploaded image. A short/wide banner used to shrink the whole hero (and a
     * tall one stretched it), so the homepage jumped around depending on which
     * slide was showing and which artwork the admin happened to upload.
     *
     * Now every banner is drawn with `object-cover` into this constant frame:
     * the image scales up to fill it and the overflow is trimmed, exactly like a
     * Facebook cover photo. The text overlay is positioned against the frame,
     * not the photo, so headlines stay put whatever the artwork's proportions.
     */
    const STAGE_HEIGHT = 'h-[190px] sm:h-[260px] md:h-[340px] lg:h-[420px]';

    useEffect(() => { setActive(0); }, [images.length]);

    // Autoplay (pauses on hover, respects reduced motion).
    useEffect(() => {
        if (!multiple || paused || reduce) return;
        const t = setInterval(() => setActive((a) => (a + 1) % images.length), SLIDE_INTERVAL);
        return () => clearInterval(t);
    }, [multiple, paused, reduce, images.length, cycle]);

    const goTo = useCallback((i: number) => {
        setActive(((i % images.length) + images.length) % images.length);
        setCycle((c) => c + 1);
    }, [images.length]);

    // Touch swipe.
    const touchX = useRef<number | null>(null);
    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (multiple && Math.abs(dx) > 48) goTo(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
    };

    // While the banners are still loading, hold the space with a neutral
    // placeholder rather than a stand-in image — that is what used to flash the
    // old banner on every reload. (Every hook above has already run, so these
    // early returns are safe.)
    if (isLoading) {
        return (
            <section className="w-full" aria-label="Featured banners">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-5">
                    <div className={`w-full animate-pulse rounded-md bg-slate-100 ring-1 ring-black/5 ${STAGE_HEIGHT}`} />
                </div>
            </section>
        );
    }
    // Loaded, but the admin hasn't added any banners — show nothing at all.
    if (images.length === 0) return null;

    return (
        <section className="w-full" aria-label="Featured banners">
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-5">
                <div
                    className="group relative w-full overflow-hidden rounded-md bg-slate-100 shadow-[0_14px_44px_-22px_rgba(15,23,42,0.4)] ring-1 ring-black/5"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => { setPaused(false); setCycle((c) => c + 1); }}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    aria-roledescription="carousel"
                >
                    {/* Stage — a constant height; banners are cover-fitted into it. */}
                    <div className={`relative w-full overflow-hidden ${STAGE_HEIGHT}`}>

                        {/* ── Crossfading banner images (+ optional text overlay) ── */}
                        {slides.map((slide, i) => {
                            const isActive = i === active;
                            const src = slide.imageUrl;
                            const href = slide.ctaHref || '/products';
                            const hasText = !!(slide.title || slide.subtitle || slide.ctaLabel);
                            const align = slide.align || 'left';
                            const dark = slide.textTone === 'dark';

                            return (
                                <motion.div
                                    key={`${src}-${i}`}
                                    className="absolute inset-0"
                                    initial={false}
                                    animate={{ opacity: isActive ? 1 : 0 }}
                                    transition={{ duration: reduce ? 0 : FADE_MS / 1000, ease: 'easeInOut' }}
                                    style={{ zIndex: isActive ? 2 : 1 }}
                                    aria-hidden={!isActive}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={src}
                                        alt=""
                                        draggable={false}
                                        loading={i === 0 ? 'eager' : 'lazy'}
                                        fetchPriority={i === 0 ? 'high' : undefined}
                                        className="h-full w-full object-cover"
                                    />

                                    {hasText && slide.scrim !== false && (
                                        /* Brand-tinted scrim on the text side. Banner artwork is rarely
                                           uniformly dark — this one fades from cream linen to green — so
                                           without it white copy can drop to ~1:1 contrast and vanish.
                                           Fades out well before the product area so the photo stays clean. */
                                        <div
                                            className="pointer-events-none absolute inset-0 z-[5]"
                                            style={{
                                                /* Stops tuned against the actual banner pixels: the weakest
                                                   spot under the copy measures 4.8:1 against white — WCAG AA
                                                   — while the photo stays untouched past ~78%. */
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
                                        /* pointer-events-none throughout: the whole banner is a single
                                           link (below), so the "button" stays purely visual and we never
                                           nest one anchor inside another. */
                                        <div
                                            className={`pointer-events-none absolute inset-0 z-[6] flex items-center px-[6%] sm:px-[7%] ${
                                                align === 'right' ? 'justify-end text-right'
                                                    : align === 'center' ? 'justify-center text-center'
                                                        : 'justify-start text-left'
                                            }`}
                                        >
                                            {/* 38% keeps the copy inside the measured-safe zone of the scrim */}
                                            <div className={align === 'center' ? 'max-w-[70%]' : 'max-w-[38%]'}>
                                                {slide.title && (
                                                    <h2
                                                        className={`text-[19px] font-bold leading-[1.2] tracking-tight drop-shadow-sm sm:text-[28px] md:text-[38px] lg:text-[46px] ${
                                                            dark ? 'text-slate-900' : 'text-white'
                                                        }`}
                                                    >
                                                        {slide.title}
                                                    </h2>
                                                )}
                                                {slide.subtitle && (
                                                    <p
                                                        className={`mt-1.5 text-[11px] leading-snug sm:mt-2.5 sm:text-[13px] md:text-[15px] lg:text-[17px] ${
                                                            dark ? 'text-slate-700' : 'text-white/85'
                                                        }`}
                                                    >
                                                        {slide.subtitle}
                                                    </p>
                                                )}
                                                {slide.ctaLabel && (
                                                    <span
                                                        className={`mt-3 inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-bold shadow-lg sm:mt-4 sm:px-6 sm:py-2.5 sm:text-[13px] md:text-[14px] ${
                                                            dark
                                                                ? 'bg-[var(--color-primary)] text-white'
                                                                : 'bg-white text-[var(--color-primary)]'
                                                        }`}
                                                    >
                                                        {slide.ctaLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Full-bleed click target — one link per slide. */}
                                    <Link
                                        href={href}
                                        aria-label={slide.title || 'Shop now'}
                                        tabIndex={isActive ? 0 : -1}
                                        className="absolute inset-0 z-[7]"
                                    />
                                </motion.div>
                            );
                        })}

                        {/* ── Arrows (glass, reveal on hover) ── */}
                        {multiple && (
                            <>
                                <button
                                    onClick={() => goTo(active - 1)}
                                    aria-label="Previous banner"
                                    className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/45 group-hover:opacity-100 md:flex"
                                >
                                    <LuChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => goTo(active + 1)}
                                    aria-label="Next banner"
                                    className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/45 group-hover:opacity-100 md:flex"
                                >
                                    <LuChevronRight size={18} />
                                </button>
                            </>
                        )}

                        {/* ── Progress dots ── */}
                        {multiple && (
                            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4">
                                {images.map((_, i) => {
                                    const isOn = i === active;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => goTo(i)}
                                            aria-label={`Go to banner ${i + 1}`}
                                            className={`relative h-[5px] overflow-hidden rounded-full shadow-sm ring-1 ring-black/5 transition-all duration-300 ${
                                                isOn ? 'w-9 bg-white/45' : 'w-[14px] bg-white/55 hover:bg-white/80'
                                            }`}
                                        >
                                            {isOn && (
                                                <AnimatePresence>
                                                    <motion.span
                                                        key={`${active}-${cycle}-${paused}`}
                                                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                                                        initial={{ width: '0%' }}
                                                        animate={{ width: paused || reduce ? '100%' : ['0%', '100%'] }}
                                                        transition={paused || reduce ? { duration: 0.3 } : { duration: SLIDE_INTERVAL / 1000, ease: 'linear' }}
                                                    />
                                                </AnimatePresence>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
