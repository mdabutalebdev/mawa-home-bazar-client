"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    LuChevronRight, LuWrench, LuSearchX,
} from 'react-icons/lu';
import { useGetCompanyServiceBySlugQuery } from '@/redux/api/companyServiceApi';
import StoreListing from '@/components/shared/StoreListing';

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

    const { data: serviceRes, isLoading: serviceLoading, isError } = useGetCompanyServiceBySlugQuery(slug, { skip: !slug });
    const service = serviceRes?.data || null;

    /* ── Loading ── */
    if (serviceLoading) {
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

    /* ── Missing or suspended: all read as not-found ── */
    if (isError || !service || !service.isActive) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-16">
                <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.07)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                        <LuSearchX size={28} />
                    </div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">This service is not available</h1>
                    <p className="text-sm text-gray-500 leading-relaxed mt-2">
                        The service you are looking for either does not exist or has been disabled.
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-4 pb-6 sm:pt-6 sm:pb-10">
            <div className="container">
                {/* ══════════ IDENTITY CARD ══════════ */}
                <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        {service.image ? (
                            <img
                                src={service.image}
                                alt={service.title}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-gray-100 bg-gray-50 flex-shrink-0"
                            />
                        ) : (
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold flex-shrink-0 ${toneOf(service.title)}`}>
                                {service.title.trim().charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight break-words">
                                {service.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px] text-gray-400 font-medium">
                                <span className="inline-flex items-center gap-1">
                                    <LuWrench size={12} />
                                    Company Service
                                </span>
                            </div>
                        </div>
                    </div>

                    {service.description && (
                        <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed mt-3.5 whitespace-pre-line">
                            {service.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-4 mb-2 ml-1">
                    <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
                    <LuChevronRight size={11} />
                    <span className="text-gray-600 font-medium truncate">{service.title}</span>
                </div>

                {/* ══════════ PRODUCTS LISTING ══════════ */}
                <div className="-mx-4 sm:-mx-6 -mt-2">
                    <StoreListing 
                        serviceId={service._id} 
                        emptyTitle="No products listed under this service yet"
                    />
                </div>
            </div>
        </div>
    );
}

