"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    LuChevronRight, LuPhone, LuMessageCircle, LuMapPin, LuGlobe,
    LuWrench, LuSearchX,
} from 'react-icons/lu';
import { useGetCompanyBySlugQuery } from '@/redux/api/companyApi';
import StoreListing from '@/components/shared/StoreListing';

/**
 * wa.me wants an international number with no punctuation. Bangladeshi numbers
 * are stored locally as 01XXXXXXXXX, so the leading 0 becomes 88.
 */
const waNumber = (raw?: string): string => {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('880')) return digits;
    if (digits.startsWith('0')) return `88${digits}`;
    if (digits.startsWith('1') && digits.length === 10) return `880${digits}`;
    return digits;
};

const AVATAR_TONES = [
    'bg-rose-50 text-rose-600',
    'bg-amber-50 text-amber-600',
    'bg-sky-50 text-sky-600',
    'bg-violet-50 text-violet-600',
    'bg-emerald-50 text-emerald-600',
    'bg-orange-50 text-orange-600',
];
const toneOf = (name: string) =>
    AVATAR_TONES[[...(name || 'C')].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];

export default function ServiceStorefrontPage() {
    const params = useParams();
    const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string) || '';

    const { data: companyRes, isLoading: companyLoading, isError } = useGetCompanyBySlugQuery(slug, { skip: !slug });
    const company = companyRes?.data || null;

    /* ── Loading ── */
    if (companyLoading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <div className="h-40 sm:h-56 bg-gray-100 animate-pulse" />
                <div className="container py-6 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                        <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
                        <div className="h-3 w-full bg-gray-100 rounded mb-2" />
                        <div className="h-3 w-2/3 bg-gray-100 rounded" />
                    </div>
                    <div className="h-96 bg-gray-100 rounded-2xl animate-pulse mt-8" />
                </div>
            </div>
        );
    }

    /* ── Missing, pending or suspended: all read as not-found ── */
    if (isError || !company || company.type !== 'service') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-16">
                <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.07)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                        <LuSearchX size={28} />
                    </div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">This service is not available</h1>
                    <p className="text-sm text-gray-500 leading-relaxed mt-2">
                        The service you are looking for either does not exist or has not been approved by the
                        marketplace yet.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
                        <Link
                            href="/"
                            className="flex-1 inline-flex items-center justify-center px-5 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const waTo = waNumber(company.whatsapp || company.phone);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* ══════════ BANNER ══════════ */}
            <div className="relative h-36 sm:h-56 bg-gray-100 overflow-hidden">
                {company.banner ? (
                    <img src={company.banner} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div
                        className="w-full h-full"
                        style={{
                            background:
                                'radial-gradient(70% 90% at 80% 0%, rgba(var(--color-primary-rgb),0.22), transparent 70%),' +
                                'linear-gradient(120deg, #f1f5f9, #e2e8f0)',
                        }}
                    />
                )}
            </div>

            <div className="container">
                {/* ══════════ IDENTITY CARD ══════════ */}
                <div className="relative -mt-10 sm:-mt-14 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                        {company.logo ? (
                            <img
                                src={company.logo}
                                alt={company.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md bg-gray-50 flex-shrink-0 -mt-8 sm:-mt-12"
                            />
                        ) : (
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold border-2 border-white shadow-md flex-shrink-0 -mt-8 sm:-mt-12 ${toneOf(company.name)}`}>
                                {company.name.trim().charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight break-words">
                                {company.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px] text-gray-400 font-medium">
                                <span className="inline-flex items-center gap-1">
                                    <LuWrench size={12} />
                                    Professional Service
                                </span>
                                {company.district?.name && (
                                    <span className="inline-flex items-center gap-1"><LuMapPin size={12} /> {company.district.name}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {company.description && (
                        <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed mt-3.5">
                            {company.description}
                        </p>
                    )}

                    {/* Contact Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
                        {company.phone && (
                            <a
                                href={`tel:${company.phone}`}
                                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold shadow-md shadow-[rgba(var(--color-primary-rgb),0.25)] hover:bg-[var(--color-primary-dark)] transition-colors"
                            >
                                <LuPhone size={16} /> Call {company.phone}
                            </a>
                        )}
                        {waTo && (
                            <a
                                href={`https://wa.me/${waTo}?text=${encodeURIComponent(`আসসালামু আলাইকুম। আমি ${company.name} থেকে সার্ভিস নিতে চাই। (Mawa Homebazar)`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#1eb955] transition-colors"
                            >
                                <LuMessageCircle size={16} /> WhatsApp
                            </a>
                        )}
                        {company.website && (
                            <a
                                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                <LuGlobe size={16} /> Website
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-3 mb-6">
                    <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
                    <LuChevronRight size={11} />
                    <span className="text-gray-600 font-medium truncate">{company.name}</span>
                </div>

                {company.about && (
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-8">
                        <h2 className="text-sm font-extrabold text-gray-900 mb-2">About {company.name}</h2>
                        <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {company.about}
                        </p>
                    </section>
                )}

                {/* ══════════ PRODUCTS LISTING ══════════ */}
                <div className="-mx-4 sm:-mx-6">
                    <StoreListing 
                        companyId={company._id} 
                        emptyTitle="No products or services listed yet"
                    />
                </div>
            </div>
        </div>
    );
}
