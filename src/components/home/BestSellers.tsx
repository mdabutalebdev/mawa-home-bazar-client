"use client";

import React from 'react';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';
import { useGetProductsQuery } from '@/redux/api/productApi';
import TopSellingCard from './TopSellingCard';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** How many top sellers the section shows — fixed, never scrolls or paginates. */
const TOP_SELLING_COUNT = 4;

/**
 * Ranking inside the section: most sold first, and when two products have sold
 * the same amount (very common early on, when everything is still at 0) the more
 * viewed one wins. createdAt only breaks a full tie so the order stays stable.
 */
const TOP_SELLING_SORT = '-totalSold,-viewCount,-createdAt';

/**
 * "Top Selling Products" — a fixed shortlist shown with the bigger landscape
 * TopSellingCard so the section visibly stands out from the other home rows.
 *
 * Which products: the ones the admin flagged as Top Selling in the product form
 * (`isBestSelling`). Only when nothing is flagged does it fall back to the whole
 * catalogue ranked the same way, so the section is never empty on a shop that
 * has no order history yet. Renders nothing if there are no products.
 */
const BestSellers: React.FC = () => {
    const { data: pickedData, isLoading } = useGetProductsQuery({
        isBestSelling: true,
        limit: TOP_SELLING_COUNT,
        sort: TOP_SELLING_SORT,
    });
    const picked: any[] = pickedData?.data || [];

    // Fallback query only fires when the admin has flagged nothing yet.
    const needsFallback = !isLoading && picked.length === 0;
    const { data: fallbackData } = useGetProductsQuery(
        { limit: TOP_SELLING_COUNT, sort: TOP_SELLING_SORT },
        { skip: !needsFallback }
    );

    const products: any[] = (picked.length > 0 ? picked : fallbackData?.data || []).slice(0, TOP_SELLING_COUNT);

    if (products.length === 0) return null;

    return (
        <div className="container mx-auto px-4 sm:px-6 my-6 sm:my-10">
            {/* Centred heading — clean, no outer bordered box; the white cards
                sit directly on the warm page background. */}
            <div className="relative flex items-center justify-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight text-center">
                    Top Selling Products
                </h2>
                <Link
                    href="/products?sort=-totalSold"
                    className="absolute right-0 hidden sm:flex items-center text-sm font-semibold text-gray-500 hover:text-[var(--color-primary)] transition-colors"
                >
                    See More <LuChevronRight size={16} />
                </Link>
            </div>

            {/* items-stretch keeps both cards in a row the exact same height. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                {products.map((product) => (
                    <TopSellingCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default BestSellers;
