"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    LuChevronRight, LuSearch, LuX, LuSearchX, LuBuilding2, LuStar,
    LuLayoutGrid, LuPackage, LuWrench, LuArrowLeft, LuArrowRight, LuMapPin,
} from 'react-icons/lu';
import { useGetPublicCompaniesQuery } from '@/redux/api/companyApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useAppSelector } from '@/redux';

const LIMIT = 12;

/* ─── Types (public projection — see company.service PUBLIC_PROJECTION) ─── */
interface CategoryRef {
    _id: string;
    name: string;
    slug?: string;
    parent?: string | null;
}

interface PublicCompany {
    _id: string;
    name: string;
    slug: string;
    type?: 'product' | 'service';
    logo?: string;
    description?: string;
    isFeatured?: boolean;
    totalProducts?: number;
    categories?: CategoryRef[];
    district?: { _id: string; name: string } | null;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

type TypeFilter = '' | 'product' | 'service';

const TYPE_TABS: { value: TypeFilter; label: string; icon: React.ReactNode }[] = [
    { value: '', label: 'All', icon: <LuLayoutGrid size={14} /> },
    { value: 'product', label: 'Products', icon: <LuPackage size={14} /> },
    { value: 'service', label: 'Services', icon: <LuWrench size={14} /> },
];

/**
 * Logo fallbacks need to be distinguishable from one another at a glance, so the
 * tone is derived from the name rather than picked at random — the same company
 * keeps the same colour on every page and every visit.
 */
const AVATAR_TONES = [
    'bg-rose-50 text-rose-600',
    'bg-amber-50 text-amber-600',
    'bg-sky-50 text-sky-600',
    'bg-violet-50 text-violet-600',
    'bg-emerald-50 text-emerald-600',
    'bg-orange-50 text-orange-600',
];

const toneOf = (name: string): string => {
    const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return AVATAR_TONES[sum % AVATAR_TONES.length];
};

/* ─── Skeleton ─── */
const CompanySkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100" />
            <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded mb-2" />
        <div className="h-3 w-3/4 bg-gray-100 rounded mb-4" />
        <div className="flex gap-2">
            <div className="h-6 w-20 bg-gray-100 rounded-lg" />
            <div className="h-6 w-16 bg-gray-100 rounded-lg" />
        </div>
    </div>
);

/* ─── Card ─── */
const CompanyCard = ({ company }: { company: PublicCompany }) => {
    const categories = company.categories || [];
    const shown = categories.slice(0, 3);
    const extra = categories.length - shown.length;

    return (
        <Link
            href={`/companies/${company.slug}`}
            className={`group bg-white rounded-2xl border shadow-sm p-5 flex flex-col transition-colors ${
                company.isFeatured
                    ? 'border-[rgba(var(--color-primary-rgb),0.3)] ring-1 ring-[rgba(var(--color-primary-rgb),0.08)]'
                    : 'border-gray-100 hover:border-[rgba(var(--color-primary-rgb),0.3)]'
            }`}
        >
            <div className="flex items-start gap-3">
                {company.logo ? (
                    <img
                        src={company.logo}
                        alt={company.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-gray-100 flex-shrink-0 bg-gray-50"
                    />
                ) : (
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold flex-shrink-0 ${toneOf(company.name)}`}>
                        {company.name.trim().charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                        <h3 className="text-[15px] font-extrabold text-gray-900 leading-snug break-words group-hover:text-[var(--color-primary)] transition-colors">
                            {company.name}
                        </h3>
                        {company.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wide flex-shrink-0 mt-0.5">
                                <LuStar size={10} /> Featured
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-gray-400 font-medium">
                        <span className="inline-flex items-center gap-1">
                            {company.type === 'service' ? <LuWrench size={11} /> : <LuPackage size={11} />}
                            {company.type === 'service' ? 'Service provider' : 'Product supplier'}
                        </span>
                        {company.district?.name && (
                            <span className="inline-flex items-center gap-1">
                                <LuMapPin size={11} /> {company.district.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {company.description && (
                <p className="text-[13px] text-gray-500 leading-relaxed mt-3 line-clamp-2">
                    {company.description}
                </p>
            )}

            {shown.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {shown.map((cat) => (
                        <span key={cat._id} className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-[11px] font-semibold">
                            {cat.name}
                        </span>
                    ))}
                    {extra > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-400 text-[11px] font-semibold">
                            +{extra}
                        </span>
                    )}
                </div>
            )}

            <span className="inline-flex items-center gap-1 mt-auto pt-4 text-xs font-bold text-[var(--color-primary)]">
                Visit storefront <LuChevronRight size={13} />
            </span>
        </Link>
    );
};

/* ─── Page ─── */
export default function CompaniesPage() {
    const { isAuthenticated } = useAppSelector(s => s.auth);

    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState<TypeFilter>('');
    const [page, setPage] = useState(1);

    // Typing must not fire a request per keystroke — these users are on mobile data.
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(q.trim()), 400);
        return () => clearTimeout(timer);
    }, [q]);

    // Any filter change resets paging, otherwise a narrower result set can leave
    // the visitor stranded on a page that no longer exists.
    useEffect(() => {
        setPage(1);
    }, [debouncedQ, category, type]);

    const { data, isLoading, isFetching } = useGetPublicCompaniesQuery({
        q: debouncedQ || undefined,
        category: category || undefined,
        type: type || undefined,
        page,
        limit: LIMIT,
    });
    const { data: categoryRes } = useGetCategoriesQuery({});

    const companies: PublicCompany[] = data?.data || [];
    const meta: Meta | undefined = data?.meta;
    const totalPages = meta?.totalPages || 1;
    const total = meta?.total || 0;

    const categories: CategoryRef[] = useMemo(
        () => (categoryRes?.data || []).filter((c: CategoryRef) => !c.parent),
        [categoryRes]
    );

    const featured = companies.filter(c => c.isFeatured);
    const rest = companies.filter(c => !c.isFeatured);

    const hasFilters = Boolean(debouncedQ || category || type);
    const joinHref = isAuthenticated ? '/join/company' : '/login?redirect=/join/company';

    const clearFilters = () => {
        setQ('');
        setDebouncedQ('');
        setCategory('');
        setType('');
    };

    // A short window around the current page — 60 numbered buttons would not fit a phone.
    const pageWindow = useMemo(() => {
        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
        const end = Math.min(totalPages, start + 4);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [page, totalPages]);

    const chipCls = (active: boolean) =>
        `px-4 min-h-[40px] inline-flex items-center gap-1.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-colors ${
            active
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[rgba(var(--color-primary-rgb),0.35)]'
        }`;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">

            {/* ══════════ HERO ══════════ */}
            <div className="relative overflow-hidden border-b border-gray-100 bg-white">
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(60% 40% at 85% 0%, rgba(var(--color-primary-rgb),0.10), transparent 70%),' +
                            'radial-gradient(45% 35% at 0% 20%, rgba(var(--color-primary-rgb),0.06), transparent 70%)',
                    }}
                />
                <div className="container relative py-8 sm:py-12">
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-3">
                        <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
                        <LuChevronRight size={11} />
                        <span className="text-gray-600 font-medium">Companies</span>
                    </div>

                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[rgba(var(--color-primary-rgb),0.08)] text-[var(--color-primary)]">
                            <LuBuilding2 size={13} /> Verified suppliers
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-3">
                            Companies on Mawa Homebazar
                        </h1>
                        <p className="text-sm sm:text-[15px] text-gray-500 leading-relaxed mt-2">
                            Browse every approved supplier and service provider on the marketplace.
                            Open a storefront to see what they sell and who to talk to.
                        </p>
                    </div>

                    {/* Search */}
                    <div className="mt-6 max-w-xl relative">
                        <LuSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by company name..."
                            aria-label="Search companies"
                            className="w-full min-h-[48px] pl-11 pr-11 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)] transition-colors"
                        />
                        {q && (
                            <button
                                type="button"
                                onClick={() => setQ('')}
                                aria-label="Clear search"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                                <LuX size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container py-6 sm:py-8">

                {/* ══════════ FILTERS ══════════ */}
                <div className="space-y-3 mb-6">
                    {/* Product / service toggle */}
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {TYPE_TABS.map((tab) => (
                            <button
                                key={tab.value || 'all'}
                                type="button"
                                onClick={() => setType(tab.value)}
                                className={chipCls(type === tab.value)}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Category row */}
                    {categories.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                            <button
                                type="button"
                                onClick={() => setCategory('')}
                                className={chipCls(category === '')}
                            >
                                All categories
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat._id}
                                    type="button"
                                    onClick={() => setCategory(cat._id)}
                                    className={chipCls(category === cat._id)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ══════════ RESULT COUNT ══════════ */}
                {!isLoading && companies.length > 0 && (
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <p className="text-xs font-semibold text-gray-400">
                            {total} {total === 1 ? 'company' : 'companies'}
                            {totalPages > 1 && ` · page ${page} of ${totalPages}`}
                        </p>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs font-bold text-[var(--color-primary)] hover:underline min-h-[36px]"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}

                {/* ══════════ RESULTS ══════════ */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <CompanySkeleton key={i} />)}
                    </div>
                ) : companies.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.07)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                            <LuSearchX size={28} />
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-gray-800">
                            {hasFilters ? 'No companies match your search' : 'No companies listed yet'}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed mt-2 max-w-md mx-auto">
                            {hasFilters
                                ? 'Try a different name, category or type — or clear the filters to see everyone.'
                                : 'Suppliers are still being approved. If you run a business, you can be one of the first listed here.'}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                            <Link
                                href={joinHref}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold shadow-md shadow-[rgba(var(--color-primary-rgb),0.25)] hover:bg-[var(--color-primary-dark)] transition-colors"
                            >
                                <LuBuilding2 size={16} /> List your company
                            </Link>
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 min-h-[48px] rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`space-y-6 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                        {featured.length > 0 && (
                            <section>
                                <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                                    <LuStar size={13} className="text-[var(--color-primary)]" /> Featured
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {featured.map((c) => <CompanyCard key={c._id} company={c} />)}
                                </div>
                            </section>
                        )}

                        {rest.length > 0 && (
                            <section>
                                {featured.length > 0 && (
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                                        All companies
                                    </h2>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rest.map((c) => <CompanyCard key={c._id} company={c} />)}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* ══════════ PAGINATION ══════════ */}
                {!isLoading && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            aria-label="Previous page"
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-[rgba(var(--color-primary-rgb),0.35)] disabled:opacity-40 disabled:hover:border-gray-200 transition-colors"
                        >
                            <LuArrowLeft size={16} />
                        </button>

                        {pageWindow.map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setPage(n)}
                                aria-current={n === page ? 'page' : undefined}
                                className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                                    n === page
                                        ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[rgba(var(--color-primary-rgb),0.35)]'
                                }`}
                            >
                                {n}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            aria-label="Next page"
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-[rgba(var(--color-primary-rgb),0.35)] disabled:opacity-40 disabled:hover:border-gray-200 transition-colors"
                        >
                            <LuArrowRight size={16} />
                        </button>
                    </div>
                )}

                {/* ══════════ JOIN CTA ══════════ */}
                {companies.length > 0 && (
                    <section className="rounded-2xl border border-[rgba(var(--color-primary-rgb),0.18)] bg-[rgba(var(--color-primary-rgb),0.04)] p-6 sm:p-8 text-center mt-8">
                        <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                            Sell on Mawa Homebazar
                        </h2>
                        <p className="text-sm text-gray-500 leading-relaxed mt-2 max-w-lg mx-auto">
                            List your products or services, reach dealers and retailers in every
                            upazila, and manage your own storefront.
                        </p>
                        <Link
                            href={joinHref}
                            className="inline-flex items-center justify-center gap-2 mt-5 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold shadow-md shadow-[rgba(var(--color-primary-rgb),0.25)] hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            <LuBuilding2 size={16} /> List your company
                        </Link>
                    </section>
                )}
            </div>
        </div>
    );
}
