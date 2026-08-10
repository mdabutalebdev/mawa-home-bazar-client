"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuFlame, LuShoppingCart, LuCheck } from 'react-icons/lu';
import { useAppDispatch, useAppSelector } from '@/redux';
import { addToCart } from '@/redux/slices/cartSlice';
import { getDisplayPrice } from '@/utils/offerPrice';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface TopSellingCardProps {
    /** Raw product document straight from GET /api/products. */
    product: any;
}

/**
 * Big landscape card used only by the "Top Selling Products" home section.
 * It is deliberately larger than the shared NewProductCard — image on the left,
 * name/price/actions on the right and a "Best Selling" ribbon — so the row reads
 * as a highlighted shortlist instead of another feed row.
 */
const TopSellingCard: React.FC<TopSellingCardProps> = ({ product }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const productId = String(product._id || product.id);
    const href = `/product/${product.slug || productId}`;
    const image = product.thumbnail || product.images?.[0] || '';

    const cartItems = useAppSelector((state: any) => state.cart.items);
    const isInCart = cartItems.some((item: any) => item.id === productId);
    const [justAdded, setJustAdded] = useState(false);

    // Same offer-window rules as the normal card: the discount only shows while
    // the offer is actually running.
    const display = getDisplayPrice({
        price: product.price,
        originalPrice: product.originalPrice ?? product.mrp ?? undefined,
        discount: typeof product.discount === 'string' ? Number(product.discount) || 0 : (product.discount ?? 0),
        offerStartDate: product.offerStartDate,
        offerEndDate: product.offerEndDate,
    });
    const currentPrice = display.currentPrice;
    const oldPrice = display.originalPrice;
    const saved = oldPrice && oldPrice > currentPrice ? oldPrice - currentPrice : 0;

    // Products with color/size variants cannot be bought straight from the home
    // page — the buyer still has to pick a variation, so send them to the detail
    // page instead of dropping an unspecified line into the cart.
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

    const putInCart = () => {
        dispatch(addToCart({
            id: productId,
            productId,
            name: product.name,
            price: currentPrice,
            mrp: oldPrice || currentPrice,
            image,
            category: product.category?.name || 'General',
        }));
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasVariants) { router.push(href); return; }
        if (!isInCart) putInCart();
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1500);
    };

    const handleBuyNow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasVariants) { router.push(href); return; }
        if (!isInCart) putInCart();
        router.push('/checkout');
    };

    return (
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg hover:border-[var(--color-primary)]/40 transition-all duration-300 overflow-hidden group">
            {/* Best Selling ribbon */}
            <span
                className="absolute top-0 right-0 z-10 flex items-center gap-1 text-white text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-bl-lg"
                style={{ background: 'var(--color-sale)' }}
            >
                <LuFlame size={12} /> Best Selling
            </span>

            <div className="flex items-stretch min-h-[150px] sm:min-h-[200px] lg:min-h-[230px]">
                {/* Image — full-bleed, fills the whole height of the card */}
                <Link
                    href={href}
                    className="relative shrink-0 self-stretch w-[130px] sm:w-[200px] lg:w-[240px] bg-slate-50/60 overflow-hidden"
                >
                    <img
                        src={image || 'https://via.placeholder.com/400x400/F1F5F9/CBD5E1?text=Product'}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/F1F5F9/CBD5E1?text=Product';
                        }}
                    />
                </Link>

                {/* Info + actions */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 sm:gap-2.5 p-3 sm:p-5 pt-7 sm:pt-8">
                    <Link href={href}>
                        <h3 className="text-[13px] sm:text-base lg:text-lg font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                            {product.name}
                        </h3>
                    </Link>

                    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                        <span className="text-base sm:text-xl font-extrabold" style={{ color: 'var(--color-sale)' }}>
                            ৳{currentPrice.toLocaleString()}
                        </span>
                        {saved > 0 && (
                            <span className="text-xs sm:text-sm line-through text-slate-400">
                                ৳{oldPrice!.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {saved > 0 && (
                        <span className="self-start bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded">
                            Save ৳{saved.toLocaleString()}
                        </span>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <button
                            onClick={handleAddToCart}
                            className="flex items-center gap-1.5 text-[11px] sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                        >
                            {justAdded || isInCart ? <LuCheck size={14} /> : <LuShoppingCart size={14} />}
                            {isInCart && !hasVariants ? 'In Cart' : 'Add To Cart'}
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex items-center gap-1.5 text-[11px] sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded text-white transition-opacity hover:opacity-90"
                            style={{ background: 'var(--color-primary)' }}
                        >
                            <LuShoppingCart size={14} /> Buy now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopSellingCard;
