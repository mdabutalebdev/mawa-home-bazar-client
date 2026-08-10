"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    LuChevronRight, LuBuilding2, LuPhone, LuMessageCircle, LuMapPin, LuGlobe,
    LuPackage, LuWrench, LuStar, LuSearchX, LuStore, LuTag, LuBox, LuArrowRight,
    LuImage, LuChevronDown,
} from 'react-icons/lu';
import { useGetCompanyBySlugQuery } from '@/redux/api/companyApi';
import { useGetProductsQuery } from '@/redux/api/productApi';

const LIMIT = 8;

interface CategoryRef { _id: string; name: string; slug?: string }

interface Product {
    _id: string;
    name: string;
    slug?: string;
    description?: string;
    thumbnail?: string;
    images?: string[];
    price?: number;
    originalPrice?: number | null;
    discount?: number;
    stock?: number;
    unit?: string;
    brand?: string;
    tags?: string[];
    category?: CategoryRef | null;
    createdAt?: string;
}

const taka = (n: unknown) => `৳${Number(n || 0).toLocaleString()}`;

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

const postedOn = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/* ─── Skeletons ─── */
const PostSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
        <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-gray-100" />
            <div className="space-y-2">
                <div className="h-3 w-28 bg-gray-200 rounded" />
                <div className="h-2.5 w-20 bg-gray-100 rounded" />
            </div>
        </div>
        <div className="aspect-[4/3] bg-gray-100" />
        <div className="p-4 space-y-2.5">
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
            <div className="h-11 w-full bg-gray-100 rounded-xl mt-3" />
        </div>
    </div>
);

/* ─── One product, written up like a photo post ─── */
const ProductPost = ({
    product, company, waTo,
}: {
    product: Product;
    company: { name: string; logo?: string; slug: string };
    waTo: string;
}) => {
    const [expanded, setExpanded] = useState(false);

    const gallery = [product.thumbnail, ...(product.images || [])].filter(Boolean) as string[];
    const [active, setActive] = useState(0);
    const hero = gallery[active];

    const hasDiscount = Boolean(product.originalPrice && Number(product.originalPrice) > Number(product.price));
    const description = product.description || '';
    const isLong = description.length > 220;
    const shown = expanded || !isLong ? description : `${description.slice(0, 220).trimEnd()}…`;

    const waHref = waTo
        ? `https://wa.me/${waTo}?text=${encodeURIComponent(
            `আসসালামু আলাইকুম। আমি "${product.name}" অর্ডার করতে চাই। (${company.name} — Mawa Homebazar)`
        )}`
        : '';

    return (
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Post header — who posted it */}
            <div className="flex items-center gap-3 px-4 py-3">
                {company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0" />
                ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${toneOf(company.name)}`}>
                        {company.name.trim().charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-[13px] font-extrabold text-gray-900 truncate">{company.name}</p>
                    <p className="text-[11px] text-gray-400">
                        {postedOn(product.createdAt)}
                        {product.category?.name ? ` · ${product.category.name}` : ''}
                    </p>
                </div>
            </div>

            {/* The photo — the whole point of the format */}
            <div className="relative bg-gray-50">
                {hero ? (
                    <img
                        src={hero}
                        alt={product.name}
                        className="w-full aspect-[4/3] sm:aspect-[16/11] object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full aspect-[4/3] flex items-center justify-center text-gray-300">
                        <LuImage size={40} />
                    </div>
                )}
                {hasDiscount && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[var(--color-primary)] text-white text-[11px] font-extrabold shadow-sm">
                        {product.discount ? `${product.discount}% OFF` : 'On offer'}
                    </span>
                )}
                {Number(product.stock) <= 0 && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-gray-900/80 text-white text-[11px] font-extrabold">
                        Out of stock
                    </span>
                )}
            </div>

            {/* Extra photos */}
            {gallery.length > 1 && (
                <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
                    {gallery.slice(0, 6).map((url, i) => (
                        <button
                            key={`${url}-${i}`}
                            type="button"
                            onClick={() => setActive(i)}
                            aria-label={`Photo ${i + 1}`}
                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-colors ${
                                i === active ? 'border-[var(--color-primary)]' : 'border-transparent'
                            }`}
                        >
                            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}

            {/* The details, written under the photo */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="text-[15px] sm:text-base font-extrabold text-gray-900 leading-snug">
                        {product.name}
                    </h3>
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 mt-1.5">
                        <span className="text-xl font-extrabold text-[var(--color-primary)]">{taka(product.price)}</span>
                        {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through">{taka(product.originalPrice)}</span>
                        )}
                        {product.unit && (
                            <span className="text-[12px] font-semibold text-gray-400">per {product.unit}</span>
                        )}
                    </div>
                </div>

                {description && (
                    <div>
                        <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{shown}</p>
                        {isLong && (
                            <button
                                type="button"
                                onClick={() => setExpanded((v) => !v)}
                                className="inline-flex items-center gap-1 mt-1.5 text-[12px] font-bold text-[var(--color-primary)]"
                            >
                                {expanded ? 'Show less' : 'Read more'}
                                <LuChevronDown size={12} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
                            </button>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-gray-500">
                    {product.brand && (
                        <span className="inline-flex items-center gap-1.5"><LuStore size={12} className="text-gray-300" /> {product.brand}</span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                        <LuBox size={12} className="text-gray-300" />
                        {Number(product.stock) > 0 ? `${product.stock} ${product.unit || 'piece'} in stock` : 'Currently unavailable'}
                    </span>
                </div>

                {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {product.tags.slice(0, 5).map((t) => (
                            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 text-[11px] font-semibold">
                                <LuTag size={10} /> {t}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    {waHref ? (
                        <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#1eb955] transition-colors"
                        >
                            <LuMessageCircle size={17} /> Order on WhatsApp
                        </a>
                    ) : (
                        <span className="flex-1 inline-flex items-center justify-center min-h-[48px] rounded-xl bg-gray-100 text-gray-400 text-sm font-bold">
                            No WhatsApp number listed
                        </span>
                    )}
                    {product.slug && (
                        <Link
                            href={`/product/${product.slug}`}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                            Details <LuArrowRight size={15} />
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
};

/* ─── Page ─── */
export default function CompanyStorefrontPage() {
    const params = useParams();
    const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string) || '';

    const [page, setPage] = useState(1);

    const { data: companyRes, isLoading: companyLoading, isError } = useGetCompanyBySlugQuery(slug, { skip: !slug });
    const company = companyRes?.data || null;

    const { data: productRes, isLoading: productsLoading, isFetching } = useGetProductsQuery(
        { company: company?._id, page, limit: LIMIT, sort: '-createdAt' },
        { skip: !company?._id }
    );

    const products: Product[] = productRes?.data || [];
    const meta = productRes?.meta || { total: 0, totalPages: 1 };

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
                    {[...Array(2)].map((_, i) => <PostSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    /* ── Missing, pending or suspended: all read as not-found ── */
    if (isError || !company) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-16">
                <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.07)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                        <LuSearchX size={28} />
                    </div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">This storefront is not available</h1>
                    <p className="text-sm text-gray-500 leading-relaxed mt-2">
                        The company you are looking for either does not exist or has not been approved by the
                        marketplace yet. Browse the approved suppliers instead.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
                        <Link
                            href="/companies"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            <LuBuilding2 size={16} /> All companies
                        </Link>
                        <Link
                            href="/"
                            className="flex-1 inline-flex items-center justify-center px-5 min-h-[48px] rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                            Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const categories: CategoryRef[] = company.categories || [];
    const waTo = waNumber(company.whatsapp || company.phone);
    const isService = company.type === 'service';

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
                            <div className="flex items-start gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight break-words">
                                    {company.name}
                                </h1>
                                {company.isFeatured && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wide mt-1">
                                        <LuStar size={10} /> Featured
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px] text-gray-400 font-medium">
                                <span className="inline-flex items-center gap-1">
                                    {isService ? <LuWrench size={12} /> : <LuPackage size={12} />}
                                    {isService ? 'Service provider' : 'Product supplier'}
                                </span>
                                {company.district?.name && (
                                    <span className="inline-flex items-center gap-1"><LuMapPin size={12} /> {company.district.name}</span>
                                )}
                                {typeof company.totalProducts === 'number' && (
                                    <span className="inline-flex items-center gap-1"><LuBox size={12} /> {company.totalProducts} listed</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {company.description && (
                        <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed mt-3.5">
                            {company.description}
                        </p>
                    )}

                    {categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3.5">
                            {categories.map((c) => (
                                <span key={c._id} className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-[11px] font-semibold">
                                    {c.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Contact — the two buttons that actually get used */}
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
                                href={`https://wa.me/${waTo}?text=${encodeURIComponent(`আসসালামু আলাইকুম। আমি ${company.name} থেকে কিছু কিনতে চাই। (Mawa Homebazar)`)}`}
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

                {/* Breadcrumb sits below the card so the banner stays edge-to-edge. */}
                <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-3">
                    <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
                    <LuChevronRight size={11} />
                    <Link href="/companies" className="hover:text-[var(--color-primary)] transition-colors">Companies</Link>
                    <LuChevronRight size={11} />
                    <span className="text-gray-600 font-medium truncate">{company.name}</span>
                </div>

                {/* ══════════ ABOUT ══════════ */}
                {company.about && (
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mt-4">
                        <h2 className="text-sm font-extrabold text-gray-900 mb-2">About {company.name}</h2>
                        <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {company.about}
                        </p>
                        {company.address && (
                            <p className="flex items-start gap-2 text-[12px] text-gray-400 mt-3.5">
                                <LuMapPin size={13} className="flex-shrink-0 mt-0.5" />
                                {company.address}
                            </p>
                        )}
                    </section>
                )}

                {/* ══════════ THE FEED ══════════ */}
                <section className="py-5 sm:py-6">
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                        <h2 className="text-sm font-extrabold text-gray-900">
                            {isService ? 'What they offer' : 'Products'}
                        </h2>
                        {!productsLoading && meta.total > 0 && (
                            <p className="text-[12px] font-semibold text-gray-400">
                                {meta.total} post{meta.total === 1 ? '' : 's'}
                            </p>
                        )}
                    </div>

                    {/* One column on purpose: each product reads as a photo post with
                        the details written underneath, not a dense tile grid. */}
                    <div className="max-w-2xl mx-auto space-y-4">
                        {productsLoading ? (
                            [...Array(3)].map((_, i) => <PostSkeleton key={i} />)
                        ) : products.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-12 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.07)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                                    <LuPackage size={28} />
                                </div>
                                <h3 className="text-base font-extrabold text-gray-800">Nothing posted yet</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mt-2 max-w-sm mx-auto">
                                    {company.name} has not published any products here yet. Call or message them —
                                    they may still have what you need.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-6">
                                    {company.phone && (
                                        <a
                                            href={`tel:${company.phone}`}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                                        >
                                            <LuPhone size={16} /> Call them
                                        </a>
                                    )}
                                    <Link
                                        href="/companies"
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 min-h-[48px] rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
                                    >
                                        Other companies
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className={`space-y-4 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                                {products.map((p) => (
                                    <ProductPost
                                        key={p._id}
                                        product={p}
                                        company={{ name: company.name, logo: company.logo, slug: company.slug }}
                                        waTo={waTo}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!productsLoading && meta.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={page === 1}
                                    className="px-5 min-h-[46px] rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 disabled:opacity-40 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-[13px] font-bold text-gray-500">
                                    {page} / {meta.totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => { setPage((p) => Math.min(meta.totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={page >= meta.totalPages}
                                    className="px-5 min-h-[46px] rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 disabled:opacity-40 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
