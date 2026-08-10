"use client";

import React from 'react';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';

interface SectionHeaderProps {
    /** Bold section title shown on the left (Daraz style). */
    title: string;
    /**
     * Optional one-line description under the title. Hidden on mobile so the
     * header stays a single line on small screens and two lines at most on
     * desktop.
     */
    subtitle?: string;
    /** Optional small accent line drawn before the title. */
    accent?: boolean;
    /** Optional link target for the right-side "See More ›" action. */
    seeMoreHref?: string;
    /** Custom label for the right-side link (defaults to "See More"). */
    seeMoreLabel?: string;
}

/**
 * Reusable Daraz-style section header: bold title on the left and an optional
 * "See More ›" link on the right. Used by the home page row sections so they all
 * share the exact same look.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    accent = true,
    seeMoreHref,
    seeMoreLabel = 'See More',
}) => {
    return (
        <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-start gap-2.5 min-w-0">
                {accent && (
                    <span
                        className="w-[3px] h-5 rounded-full shrink-0 mt-0.5"
                        style={{ background: 'var(--color-primary)' }}
                    />
                )}
                <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight truncate">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="hidden sm:block text-xs text-gray-500 mt-0.5 truncate">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {seeMoreHref && (
                <Link
                    href={seeMoreHref}
                    className="flex items-center text-xs sm:text-sm font-semibold text-gray-600 hover:text-[var(--color-primary)] transition-colors"
                >
                    {seeMoreLabel} <LuChevronRight size={16} />
                </Link>
            )}
        </div>
    );
};

export default SectionHeader;
