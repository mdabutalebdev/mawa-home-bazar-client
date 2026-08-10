"use client";

import React from 'react';
import { LuShield, LuTruck, LuBadgeCheck, LuBanknote } from 'react-icons/lu';

const items = [
    {
        icon: LuShield,
        label: 'Safe Payment',
        sub: '100% secure & encrypted transactions',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        ring: 'group-hover:ring-emerald-200',
    },
    {
        icon: LuTruck,
        label: 'Fast Delivery',
        sub: 'Quick doorstep delivery nationwide',
        iconBg: 'bg-[var(--color-primary-lightest)]',
        iconColor: 'text-[var(--color-primary)]',
        ring: 'group-hover:ring-[var(--color-primary-border)]',
    },
    {
        icon: LuBadgeCheck,
        label: '100% Halal',
        sub: 'Authentic, purity you can trust',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        ring: 'group-hover:ring-amber-200',
    },
    {
        icon: LuBanknote,
        label: 'Cash on Delivery',
        sub: 'Pay only when it reaches your hand',
        iconBg: 'bg-sky-50',
        iconColor: 'text-sky-600',
        ring: 'group-hover:ring-sky-200',
    },
];

/**
 * Trust strip — four wide cards
 * (Safe Payment | Fast Delivery | 100% Halal | Cash on Delivery).
 * Each card fills its column and lays the icon badge beside the title +
 * supporting line, giving a landscape card. Four columns would be far too
 * cramped on a phone, so the grid drops to 2×2 there and the icon stacks above
 * centred text. On hover or focus the card lifts on a soft spring, a
 * brand-tinted shadow blooms under it, a sheen of light sweeps across, and the
 * icon badge scales up with a slight tilt (see `.trust-card` in globals.css).
 */
const TrustStrip: React.FC = () => {
    return (
        <div className="container mx-auto px-2 sm:px-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4 my-2 sm:my-4">
                {items.map(({ icon: Icon, label, sub, iconBg, iconColor, ring }) => (
                    <div
                        key={label}
                        tabIndex={0}
                        className="trust-card group flex w-full flex-col items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-4 text-center shadow-sm outline-none sm:flex-row sm:items-center sm:gap-3.5 sm:px-5 sm:py-4 sm:text-left"
                    >
                        {/* Icon — stacked on top on mobile, beside the text from sm: up */}
                        <div
                            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full ${iconBg} ring-4 ring-transparent ${ring} transition-all duration-400 ease-out group-hover:scale-110 group-focus-within:scale-110`}
                        >
                            <Icon className={`${iconColor} w-4 h-4 sm:w-[22px] sm:h-[22px] transition-transform duration-400 ease-out group-hover:-rotate-6`} />
                        </div>
                        {/* Text block — sits to the right of the icon on wider screens */}
                        <div className="min-w-0">
                            <p className="text-[11px] sm:text-sm font-semibold text-slate-800 leading-tight">
                                {label}
                            </p>
                            <p className="hidden sm:block text-xs text-slate-500 leading-snug mt-0.5">
                                {sub}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrustStrip;
