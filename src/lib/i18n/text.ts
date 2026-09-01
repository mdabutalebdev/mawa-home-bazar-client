import type { Lang } from './dictionary';

/**
 * A CMS string value the frontend can render. The admin panel writes bilingual
 * pairs (`{ en, bn }`), but old documents or one-language fields may still be
 * plain strings — accepting both keeps rendering safe during the migration
 * period and forever after.
 */
export type BiText =
    | string
    | null
    | undefined
    | { en?: string | null; bn?: string | null };

/**
 * Pick the string for the current language, with a graceful fallback chain:
 *   preferred language → the other language → plain-string form → ''.
 *
 * Never throws. Never returns `undefined` — a missing translation renders as
 * an empty string so React never prints "undefined" into a heading.
 */
export function pickText(value: BiText, lang: Lang): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    const primary = lang === 'bn' ? value.bn : value.en;
    if (typeof primary === 'string' && primary.length > 0) return primary;
    // Fall back to whatever the other language has, so a half-filled entry
    // still reads as text rather than an empty heading.
    const other = lang === 'bn' ? value.en : value.bn;
    if (typeof other === 'string') return other;
    return '';
}
