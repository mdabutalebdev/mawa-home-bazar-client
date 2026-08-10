"use client";

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { Lang } from '@/lib/i18n/dictionary';

interface Props {
    /** `brand` sits on the green header, `surface` on white/grey cards. */
    variant?: 'brand' | 'surface';
    className?: string;
}

const OPTIONS: { value: Lang; label: string; aria: string; bangla?: boolean }[] = [
    { value: 'en', label: 'EN', aria: 'English' },
    { value: 'bn', label: 'বাংলা', aria: 'Bangla', bangla: true },
];

/**
 * Compact EN / বাংলা pill.
 *
 * Both options stay visible instead of cycling on tap — a shopkeeper who has
 * landed on the wrong language must be able to see the way back, not guess it.
 */
const LanguageToggle: React.FC<Props> = ({ variant = 'brand', className = '' }) => {
    const { lang, setLang } = useLanguage();

    const shell =
        variant === 'brand'
            ? 'bg-white/15 ring-1 ring-white/25'
            : 'bg-gray-100 ring-1 ring-gray-200';

    const activeCls = 'bg-white text-[var(--color-primary)] shadow-sm';

    const idleCls =
        variant === 'brand'
            ? 'text-white/85 hover:text-white hover:bg-white/10'
            : 'text-gray-500 hover:text-gray-800 hover:bg-white/70';

    return (
        <div
            role="group"
            aria-label="Language / ভাষা"
            className={`inline-flex shrink-0 items-center rounded-full p-0.5 ${shell} ${className}`}
        >
            {OPTIONS.map((o) => {
                const active = lang === o.value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => setLang(o.value)}
                        aria-pressed={active}
                        aria-label={o.aria}
                        title={o.aria}
                        // Full 44px target on phones; tightened once there is a mouse.
                        className={`min-h-[44px] sm:min-h-[30px] min-w-[44px] sm:min-w-[38px] px-2 rounded-full text-[11.5px] font-bold leading-none flex items-center justify-center whitespace-nowrap transition-colors ${active ? activeCls : idleCls}`}
                        style={o.bangla ? { fontFamily: 'var(--font-bangla)' } : undefined}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
};

export default LanguageToggle;
