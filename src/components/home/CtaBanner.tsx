"use client";

import React from 'react';
import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

/**
 * Bottom-of-page call-to-action band — light cream card sitting on the cream
 * page, with a small navy button. Kept quiet on purpose: the site's colour
 * anchors are already the header, hero and stats bar, so this section is a
 * gentle closer rather than another loud block.
 */
const CtaBanner: React.FC = () => {
    const { lang } = useLanguage();
    const isBn = lang === 'bn';

    return (
        <section className="w-full">
            {/* No bottom padding — the card sits flush against the navy footer
                that follows, so there's no cream dead-band between them. */}
            <div className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-8 sm:pb-12">
                <div
                    className="relative overflow-hidden rounded-2xl border border-gray-200 p-8 sm:p-12 text-center"
                    style={{
                        background: 'linear-gradient(135deg, #FFFDF5 0%, #FFF3C4 100%)',
                    }}
                >
                    <span
                        className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-white text-[11px] font-bold tracking-[0.18em] uppercase"
                        style={{ color: 'var(--color-primary)' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
                        {isBn ? 'মার্কেটপ্লেসে যোগ দিন' : 'Join the marketplace'}
                    </span>

                    <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
                        {isBn ? 'শুরু করতে প্রস্তুত?' : 'Are you prepared to begin?'}
                    </h2>
                    <p className="text-sm md:text-base text-gray-700 mb-8 max-w-xl mx-auto leading-relaxed">
                        {isBn
                            ? 'হাজারো মানসম্মত প্রোডাক্ট নিয়ে আজই সারা বাংলাদেশে কাস্টমারের কাছে পৌঁছে দিন।'
                            : 'Explore thousands of quality products and get them delivered to customers across Bangladesh today!'}
                    </p>

                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center gap-2 text-white font-bold text-sm px-7 py-3 rounded-md shadow-sm"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        {isBn ? 'শপ নাউ' : 'Shop Now'} <LuArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default CtaBanner;
