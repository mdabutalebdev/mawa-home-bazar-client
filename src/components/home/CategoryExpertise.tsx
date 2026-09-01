"use client";

import React from 'react';
import Link from 'next/link';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';

interface Category {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
    image?: string;
    parent?: string | { _id: string } | null;
}

const ICON_MAP: { keywords: string[]; icon: string }[] = [
    { keywords: ['construction', 'engineering', 'civil', 'architect'],                              icon: '🏗️' },
    { keywords: ['electrical', 'electronics', 'electric'],                                          icon: '⚡' },
    { keywords: ['family', 'kids', 'daily care', 'baby', 'child'],                                 icon: '👨‍👩‍👧‍👦' },
    { keywords: ['fashion', 'personal style', 'clothing', 'apparel', 'garment'],                   icon: '👗' },
    { keywords: ['home & lifestyle', 'home and lifestyle', 'lifestyle', 'home decor', 'interior', 'furniture', 'kitchen'], icon: '🏠' },
    { keywords: ['industrial', 'manufacturing', 'factory', 'machinery'],                            icon: '🏭' },
    { keywords: ['agriculture', 'food industry', 'farming', 'agro'],                               icon: '🌾' },
    { keywords: ['auto', 'vehicle', 'motor', 'car', 'bike', 'truck'],                             icon: '🚗' },
    { keywords: ['sport', 'fitness', 'gym', 'exercise', 'outdoor'],                               icon: '⚽' },
    { keywords: ['health', 'beauty', 'cosmetic', 'skincare', 'medical', 'pharma', 'wellness'],    icon: '💊' },
    { keywords: ['toy', 'game', 'play', 'puzzle'],                                                 icon: '🧸' },
    { keywords: ['bag', 'luggage', 'backpack', 'suitcase'],                                        icon: '👜' },
    { keywords: ['shoe', 'footwear', 'sneaker', 'sandal', 'boot'],                                icon: '👟' },
    { keywords: ['watch', 'jewel', 'accessories', 'sunglass'],                                     icon: '⌚' },
    { keywords: ['gadget', 'tool', 'hardware', 'equipment'],                                       icon: '🔧' },
    { keywords: ['book', 'stationery', 'education', 'office', 'school'],                          icon: '📚' },
    { keywords: ['phone', 'smartphone', 'mobile', 'tablet'],                                       icon: '📱' },
    { keywords: ['computer', 'laptop', 'pc', 'desktop'],                                           icon: '💻' },
    { keywords: ['grocery', 'supermarket', 'vegetable', 'fruit', 'food', 'restaurant', 'catering', 'bakery'], icon: '🛒' },
    { keywords: ['pet', 'animal', 'dog', 'cat', 'bird'],                                          icon: '🐾' },
    { keywords: ['energy', 'solar', 'power', 'oil', 'gas'],                                       icon: '🔋' },
    { keywords: ['chemical', 'plastic', 'rubber', 'material'],                                     icon: '🧪' },
    { keywords: ['security', 'safety', 'surveillance', 'cctv'],                                   icon: '🔒' },
    { keywords: ['textile', 'fabric', 'yarn', 'thread'],                                          icon: '🧵' },
    { keywords: ['printing', 'packaging', 'paper', 'cardboard'],                                  icon: '🖨️' },
];

function resolveIcon(name: string, dbIcon?: string): string {
    if (dbIcon && dbIcon.length <= 8) return dbIcon; // emoji from DB preferred
    const lower = name.toLowerCase();
    for (const entry of ICON_MAP) {
        if (entry.keywords.some(kw => lower.includes(kw))) return entry.icon;
    }
    return '📦';
}

/**
 * "আমাদের প্রোডাক্ট সমূহ" — dense category grid modelled on shopbasebd.com.
 * Every top-level category renders as a small square tile with an image or
 * emoji and its label underneath; the whole tile is a link to that category's
 * product listing. No horizontal scroller — everything is visible at once.
 */
const CategoryExpertise: React.FC = () => {
    const { data: categoriesData, isLoading } = useGetCategoriesQuery({});
    const apiCategories: Category[] = categoriesData?.data || [];
    // Top-level categories only — sub-categories would blow the grid out.
    const categories: Category[] = apiCategories.filter((c) => !c.parent);

    if (isLoading) {
        return (
            <section className="w-full">
                <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
                    <div className="h-6 w-56 rounded bg-gray-100 animate-pulse mx-auto mb-4" />
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="aspect-square rounded-lg bg-white ring-1 ring-gray-100 animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (categories.length === 0) return null;

    return (
        <section id="home-categories" className="w-full scroll-mt-24">
            {/* Outer container carries the px-4/6 gutter so the cream card's
                left/right edges line up EXACTLY with the stats tiles and every
                other section (which all sit inside the same padded container). */}
            <div className="container mx-auto px-4 sm:px-6">
              <div
                className="px-4 sm:px-8 py-6 sm:py-10 rounded-2xl"
                style={{
                    // Slightly deeper cream — same warm family as the page bg
                    // so the block reads as a raised card, not a colour break.
                    background: '#FFF3C4',
                }}
              >
                {/* Header */}
                <header className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                        আমাদের প্রোডাক্ট সমূহ
                    </h2>
                    <p className="mt-1 text-[11px] sm:text-sm text-gray-700 max-w-2xl mx-auto">
                        নিচের যেকোনো ক্যাটেগরিতে ক্লিক করে সেই ক্যাটেগরির সব প্রোডাক্ট দেখুন।
                    </p>
                </header>

                {/* Dense grid — 4 cols on phones, 10 on desktop. Same feel as
                    shopbasebd.com — every top-level category is one tap away. */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2.5">
                    {categories.map((cat) => (
                        <Link
                            key={cat._id}
                            href={`/products?category=${cat._id}`}
                            className="flex flex-col items-center rounded-lg bg-white p-1.5 sm:p-2 shadow-sm ring-1 ring-gray-100"
                        >
                            <div className="w-full aspect-square rounded-md bg-white overflow-hidden flex items-center justify-center">
                                {cat.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        loading="lazy"
                                        className="w-full h-full object-contain p-1"
                                    />
                                ) : (
                                    <span className="text-2xl sm:text-3xl select-none">
                                        {resolveIcon(cat.name, cat.icon)}
                                    </span>
                                )}
                            </div>
                            <span className="mt-1 w-full text-[10px] sm:text-[11px] font-semibold text-gray-800 text-center leading-tight line-clamp-2">
                                {cat.name}
                            </span>
                        </Link>
                    ))}
                </div>
              </div>
            </div>
        </section>
    );
};

export default CategoryExpertise;
