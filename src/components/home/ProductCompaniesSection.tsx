"use client";

import React from 'react';
import Link from 'next/link';
import { useGetCompanyServicesQuery } from '@/redux/api/companyServiceApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const MAX_ITEMS = 24;

const ProductCompaniesSection: React.FC = () => {
    // Querying with type='product_company' to get the 11 companies
    const { data: serviceData, isLoading } = useGetCompanyServicesQuery({ limit: MAX_ITEMS, type: 'product_company' });
    const { lang } = useLanguage();
    const isBn = lang === 'bn';

    const companies = serviceData?.data || [];

    if (!isLoading && companies.length === 0) return null;

    return (
        <section className="w-full bg-white py-8 sm:py-16 border-t border-gray-100">
            <div className="container mx-auto px-4 sm:px-6">
                <header className="text-center mb-8 sm:mb-12">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        {isBn ? 'উৎপাদনশীল বিভিন্ন কোম্পানির প্রোডাক্ট ও ইমপোর্ট-এক্সপোর্ট কোম্পানির প্রোডাক্ট' : 'Manufacturing, Import & Export Company Products'}
                    </h2>
                    <div className="w-16 h-1 bg-gray-200 mx-auto mt-4 rounded-full"></div>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center text-center gap-3 p-4 animate-pulse">
                                <div className="w-16 h-16 rounded-full bg-gray-100" />
                                <div className="h-3 bg-gray-100 rounded w-24" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                        {companies.map((company: any, i: number) => {
                            const title = (isBn && company.titleBn) ? company.titleBn : company.title;
                            const image = company.image || '';
                            const href = `/services/${company.slug || company._id}`;

                            const isClickable = !!(company.slug || company._id);
                            const Wrapper: any = isClickable ? Link : 'div';
                            const wrapperProps: any = isClickable
                                ? { href }
                                : {};

                            return (
                                <Wrapper
                                    key={company._id || i}
                                    {...wrapperProps}
                                    className={`group flex flex-col items-center text-center gap-3 p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${isClickable ? 'hover:border-[var(--color-primary)] cursor-pointer transition-all duration-300' : ''}`}
                                >
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center p-0.5 group-hover:border-[var(--color-primary)] transition-colors duration-300">
                                        {image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={image}
                                                alt={title}
                                                className="w-full h-full object-cover rounded-full"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 rounded-full"></div>
                                        )}
                                    </div>
                                    <h3 className="text-[13px] sm:text-sm font-semibold text-gray-800 leading-tight group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                                        {title}
                                    </h3>
                                </Wrapper>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProductCompaniesSection;
