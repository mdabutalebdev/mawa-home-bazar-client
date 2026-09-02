"use client";

import React from 'react';
import Link from 'next/link';
import { LuArrowRight, LuWrench } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useGetCompanyServicesQuery } from '@/redux/api/companyServiceApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';

const MAX_ITEMS = 24;

const ServiceCompaniesSection: React.FC = () => {
    const { data: siteData } = useGetSiteContentQuery(undefined);
    const { data: serviceData, isLoading } = useGetCompanyServicesQuery({ limit: MAX_ITEMS, type: 'service' });
    const { lang } = useLanguage();
    const isBn = lang === 'bn';
    
    const s = siteData?.data?.serviceCompaniesSection;

    // If disabled via admin panel, don't render.
    if (!s || s.enabled === false) return null;

    const services = serviceData?.data || [];

    return (
        <section
            className="w-full"
            style={{
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

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/50 border border-gray-100 shadow-sm px-3.5 py-3.5 sm:px-4 sm:py-4 animate-pulse">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-200 flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : services.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm sm:text-base text-gray-500 font-medium bg-white/60 inline-block px-6 py-3 rounded-full border border-gray-100 shadow-sm">
                            {isBn ? 'বর্তমানে কোনো সার্ভিস উপলব্ধ নেই।' : 'No services available at the moment.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {services.map((service: any, i: number) => {
                            const title = (isBn && service.titleBn) ? service.titleBn : service.title;
                            const description = (isBn && service.descriptionBn) ? service.descriptionBn : (service.description || (isBn ? 'প্রফেশনাল সার্ভিস' : 'Professional Service'));
                            const image = service.image || '';
                            const href = `/services/${service.slug || service._id}`;

                            const isClickable = !!(service.slug || service._id);
                            const Wrapper: any = isClickable ? Link : 'div';
                            const wrapperProps: any = isClickable
                                ? { href }
                                : {};

                            return (
                                <Wrapper
                                    key={service._id || i}
                                    {...wrapperProps}
                                    className={`group flex items-center gap-3.5 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] px-4 py-4 sm:px-5 sm:py-5 ${isClickable ? 'hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer' : ''}`}
                                >
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-amber-100/50">
                                        {image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={image}
                                                alt={title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <LuWrench size={24} className="text-amber-500 group-hover:scale-110 transition-transform duration-300" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-[14px] sm:text-[16px] font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                                            {title}
                                        </h3>
                                        {description && (
                                            <p className="mt-1 text-[11.5px] sm:text-[13px] text-gray-500 leading-snug line-clamp-2">
                                                {description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
                                        <LuArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Wrapper>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ServiceCompaniesSection;

