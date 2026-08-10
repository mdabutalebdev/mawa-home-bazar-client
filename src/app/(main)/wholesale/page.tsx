"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    LuBoxes, LuSearch, LuLockKeyhole, LuLogIn, LuStore, LuPackage, LuMinus, LuPlus,
    LuTag, LuTruck, LuBadgeCheck, LuClock, LuTriangleAlert, LuBuilding,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useGetWholesaleCatalogueQuery } from '@/redux/api/retailerApi';
import { useGetPublicCompaniesQuery } from '@/redux/api/companyApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';

/* ─── Types (the wholesale projection only — see product.company.service) ─── */
interface Tier { minQty: number; price: number }
interface Ref { _id: string; name?: string; slug?: string; logo?: string }

interface WholesaleProduct {
    _id: string;
    name: string;
    slug?: string;
    thumbnail?: string;
    images?: string[];
    price?: number;
    wholesalePrice?: number;
    moq?: number;
    wholesaleTiers?: Tier[];
    stock?: number;
    unit?: string;
    brand?: string;
    company?: Ref | string | null;
    category?: Ref | string | null;
}

const taka = (n: number) => `৳${Number(n || 0).toLocaleString()}`;

const refName = (r: Ref | string | null | undefined) =>
    r && typeof r === 'object' ? r.name || '' : '';

/**
 * Unit price for a quantity — the deepest tier the quantity reaches, else the
 * flat wholesale price. Deliberately mirrors `wholesaleUnitPrice` on the server,
 * which is what actually prices the order; this is only the preview.
 */
const unitPriceFor = (product: WholesaleProduct, qty: number): number => {
    const reached = (product.wholesaleTiers || [])
        .filter((t) => qty >= Number(t.minQty))
        .sort((a, b) => Number(b.minQty) - Number(a.minQty));
    if (reached.length > 0) return Number(reached[0].price);
    return Number(product.wholesalePrice) || Number(product.price) || 0;
};

const tierLabel = (tiers: Tier[]) =>
    [...tiers]
        .sort((a, b) => Number(a.minQty) - Number(b.minQty))
        .map((t) => `${t.minQty}+ ${taka(t.price)}`)
        .join(', ');

/* ─── Locked state ─── */
const LockedCard = ({
    title, message, primaryHref, primaryLabel, icon: Icon,
}: {
    title: string; message: string; primaryHref: string; primaryLabel: string; icon: React.ElementType;
}) => (
    <div className="min-h-[70vh] bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 sm:p-10 max-w-lg w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-5">
                <Icon size={30} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{title}</h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-7">{message}</p>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <Link
                    href={primaryHref}
                    className="px-6 py-3.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                    {primaryLabel}
                </Link>
                <Link
                    href="/products"
                    className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                    Shop retail instead
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-7 border-t border-gray-50 text-left">
                {[
                    { icon: LuTag, title: 'Trade prices', text: 'Buy at dealer rates, keep the retail margin.' },
                    { icon: LuBoxes, title: 'Volume breaks', text: 'The more you order, the lower the unit price.' },
                    { icon: LuTruck, title: 'Local dealer', text: 'Your upazila dealer delivers to the shop.' },
                ].map((b) => (
                    <div key={b.title}>
                        <b.icon size={16} className="text-[var(--color-primary)] mb-2" />
                        <p className="text-[13px] font-bold text-gray-800">{b.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{b.text}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const CardSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
        <div className="aspect-square w-full rounded-xl bg-gray-100 mb-3" />
        <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
        <div className="h-3 w-1/2 bg-gray-100 rounded mb-4" />
        <div className="h-10 w-full bg-gray-50 rounded-xl" />
    </div>
);

/* ─── One product ─── */
const ProductCard = ({ product }: { product: WholesaleProduct }) => {
    const moq = Math.max(1, Number(product.moq) || 1);
    const [raw, setRaw] = useState<string>(String(moq));

    const parsed = Number(raw);
    const belowMoq = raw !== '' && Number.isFinite(parsed) && parsed < moq;
    // Pricing always previews a legal order, so an under-MOQ box still shows the
    // price the shopkeeper would actually pay once the quantity is corrected.
    const qty = Number.isFinite(parsed) && parsed > 0 ? Math.max(moq, Math.floor(parsed)) : moq;

    const unit = unitPriceFor(product, qty);
    const retail = Number(product.price) || 0;
    const flat = Number(product.wholesalePrice) || 0;
    const tiers = product.wholesaleTiers || [];
    const saving = retail > 0 && flat > 0 ? Math.round(((retail - flat) / retail) * 100) : 0;
    const image = product.thumbnail || product.images?.[0] || '';
    const unitWord = product.unit || 'piece';
    const step = (delta: number) => setRaw(String(Math.max(moq, qty + delta * moq)));

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="relative aspect-square bg-gray-50">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <LuPackage size={38} />
                    </div>
                )}
                {saving > 0 && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg bg-[var(--color-primary)] text-white text-[11px] font-bold">
                        {saving}% off retail
                    </span>
                )}
            </div>

            <div className="p-4 flex flex-col flex-1">
                <p className="text-[13px] sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2">{product.name}</p>
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 truncate">
                    <LuBuilding size={11} className="shrink-0" />
                    {refName(product.company) || product.brand || 'Supplier'}
                </p>

                {/* Prices */}
                <div className="flex items-end gap-2 mt-3">
                    <span className="text-xl font-bold text-[var(--color-primary)]">{taka(flat)}</span>
                    {retail > 0 && retail > flat && (
                        <span className="text-sm text-gray-400 line-through mb-0.5">{taka(retail)}</span>
                    )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                    MOQ {moq} {unitWord}{moq === 1 ? '' : 's'}
                    {typeof product.stock === 'number' ? ` · ${product.stock} in stock` : ''}
                </p>

                {tiers.length > 0 && (
                    <div className="mt-2.5 px-2.5 py-2 rounded-lg bg-emerald-50/60">
                        <p className="text-[11px] font-bold text-emerald-700">Volume tiers</p>
                        <p className="text-[11px] text-emerald-600 mt-0.5">{tierLabel(tiers)}</p>
                    </div>
                )}

                {/* Quantity + live price */}
                <div className="mt-auto pt-4">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => step(-1)}
                            disabled={qty <= moq}
                            className="w-10 h-10 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            <LuMinus size={15} />
                        </button>
                        <input
                            type="number"
                            inputMode="numeric"
                            min={moq}
                            step={1}
                            value={raw}
                            aria-label={`Quantity for ${product.name}`}
                            onChange={(e) => setRaw(e.target.value)}
                            onBlur={() => setRaw(String(qty))}
                            className="flex-1 w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-center font-bold text-gray-800 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]"
                        />
                        <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => step(1)}
                            className="w-10 h-10 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <LuPlus size={15} />
                        </button>
                    </div>

                    {belowMoq && (
                        <p className="text-[11px] text-amber-600 mt-2">
                            Minimum order is {moq} {unitWord}{moq === 1 ? '' : 's'} — priced at {moq}.
                        </p>
                    )}

                    <div className="mt-3 px-3 py-2.5 rounded-xl bg-gray-50 flex items-center justify-between gap-2">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Your price</p>
                            <p className="text-sm font-bold text-gray-900">
                                {taka(unit)} <span className="text-[11px] font-semibold text-gray-400">/ {unitWord}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{qty} × total</p>
                            <p className="text-sm font-bold text-[var(--color-primary)]">{taka(unit * qty)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Page ─── */
export default function WholesalePage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user as { role?: string } | null)?.role;
    const isRestoring = useAppSelector((s) => s.auth.isRestoring);

    const [search, setSearch] = useState('');
    const [q, setQ] = useState('');
    const [company, setCompany] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);
    const limit = 12;

    // Debounced so a shopkeeper typing on a phone keyboard is not one request per keystroke.
    useEffect(() => {
        const id = setTimeout(() => { setQ(search.trim()); setPage(1); }, 400);
        return () => clearTimeout(id);
    }, [search]);

    const eligible = isAuthenticated && role === 'retailer';

    const { data: res, isLoading, isFetching, error } = useGetWholesaleCatalogueQuery(
        { q: q || undefined, company: company || undefined, category: category || undefined, page, limit },
        { skip: !eligible },
    );

    const { data: companyRes } = useGetPublicCompaniesQuery({ limit: 50 }, { skip: !eligible });
    const { data: categoryRes } = useGetCategoriesQuery(undefined, { skip: !eligible });

    const products: WholesaleProduct[] = res?.data?.products || [];
    const meta = res?.data?.meta || { page: 1, totalPages: 1, total: 0 };
    const companies: Ref[] = companyRes?.data || [];
    const categories: Ref[] = useMemo(() => categoryRes?.data || [], [categoryRes]);

    // 404 = no shop registered, 403 = registered but not verified yet. Both are
    // normal states for this page, not failures.
    const status = (error as { status?: number | string })?.status;
    const apiMessage = (error as { data?: { message?: string } })?.data?.message;

    if (isRestoring) {
        return (
            <div className="min-h-[70vh] bg-[#F8FAFC] px-4 py-10">
                <div className="max-w-6xl mx-auto space-y-4">
                    <div className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <LockedCard
                icon={LuLogIn}
                title="Trade prices need a verified shop"
                message="Wholesale rates are only shown to registered shopkeepers. Sign in with your shop account, or register your shop to get verified."
                primaryHref="/login?redirect=/wholesale"
                primaryLabel="Sign in"
            />
        );
    }

    if (!eligible) {
        return (
            <LockedCard
                icon={LuStore}
                title="Register your shop to unlock trade prices"
                message="This catalogue is for verified retail shops. Tell us about your shop — name, trade licence and area — and once our team verifies it, wholesale prices open up here."
                primaryHref="/join/retailer"
                primaryLabel="Register my shop"
            />
        );
    }

    if (status === 404) {
        return (
            <LockedCard
                icon={LuStore}
                title="No shop registered yet"
                message={apiMessage || 'We could not find a shop registered to your account. Register your shop to see trade prices.'}
                primaryHref="/join/retailer"
                primaryLabel="Register my shop"
            />
        );
    }

    if (status === 403) {
        return (
            <LockedCard
                icon={LuClock}
                title="Your shop is not verified yet"
                message={apiMessage || 'Trade prices unlock once our team verifies your shop. This usually takes 1–2 working days.'}
                primaryHref="/join/retailer"
                primaryLabel="Check my application"
            />
        );
    }

    if (error) {
        return (
            <LockedCard
                icon={LuTriangleAlert}
                title="The catalogue could not be loaded"
                message={apiMessage || 'Something went wrong while loading trade prices. Please try again in a moment.'}
                primaryHref="/wholesale"
                primaryLabel="Try again"
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-3">
                        <LuBadgeCheck size={12} /> Verified shop
                    </span>
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2.5">
                        <LuBoxes size={26} className="text-[var(--color-primary)]" /> Wholesale catalogue
                    </h1>
                    <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                        Trade prices for your shop. Order at least the MOQ; larger quantities drop to the volume tier price automatically.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-5 sm:py-7">
                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 sm:p-4 mb-5">
                    <div className="relative mb-3">
                        <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search the catalogue…"
                            aria-label="Search the wholesale catalogue"
                            className="w-full min-h-[44px] pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)] transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <select
                            value={company}
                            aria-label="Filter by supplier"
                            onChange={(e) => { setCompany(e.target.value); setPage(1); }}
                            className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[var(--color-primary)]"
                        >
                            <option value="">All suppliers</option>
                            {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <select
                            value={category}
                            aria-label="Filter by category"
                            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                            className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[var(--color-primary)]"
                        >
                            <option value="">All categories</option>
                            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <LuPackage size={44} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-base font-bold text-gray-600 mb-1">Nothing matches that</h3>
                        <p className="text-sm text-gray-400">
                            {q || company || category
                                ? 'Try a different search or clear the filters.'
                                : 'No supplier has opened a wholesale price yet. Check back soon.'}
                        </p>
                        {(q || company || category) && (
                            <button
                                onClick={() => { setSearch(''); setCompany(''); setCategory(''); setPage(1); }}
                                className="mt-5 px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <p className="text-xs text-gray-400 mb-3">
                            {meta.total} product{meta.total === 1 ? '' : 's'} at trade price
                        </p>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${isFetching ? 'opacity-60 transition-opacity' : ''}`}>
                            {products.map((p) => <ProductCard key={p._id} product={p} />)}
                        </div>
                    </>
                )}

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-7">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-bold text-gray-500">Page {page} of {meta.totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                            disabled={page >= meta.totalPages}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}

                <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-start gap-3">
                    <LuLockKeyhole size={16} className="text-gray-300 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Trade prices are confidential to your shop. The final price on an order is recalculated
                        by the marketplace from the quantity you confirm, so the figures here are a preview.
                    </p>
                </div>
            </div>
        </div>
    );
}
