import React from 'react';

/**
 * Mawa Homebazar BD brand logo.
 *
 * Both halves are drawn, not photographed: the emblem is inline SVG and the
 * wordmark is HTML text. Nothing here loads a bitmap, so the lockup stays
 * sharp at every size, recolours itself from `--color-primary` (see
 * `src/config/brand.ts`), and costs no extra network request.
 *
 * The mark is a shopping bag — the plainest signal of "this is a shop" — with
 * an M cut into the face and a gold handle carried over from the brand's warm
 * accent.
 *
 *  • default        — emblem + brand-colour wordmark, for light surfaces.
 *  • `light`        — emblem + white wordmark, for dark surfaces such as the
 *                     brand-green header and the admin sidebar.
 *  • `boxed`        — the default lockup wrapped in a white rounded chip.
 *  • `iconOnly`     — the emblem alone, for tight spaces.
 */
interface LogoProps {
    /** Logo height in px (used when `imgClassName` is not set). */
    size?: number;
    /** On a dark background — emblem + white wordmark. */
    light?: boolean;
    /** Wrap the lockup in a white rounded chip. */
    boxed?: boolean;
    /** Kept for API compatibility (no-op). */
    showTagline?: boolean;
    /** Render only the compact emblem (no wordmark) — for tight spaces. */
    iconOnly?: boolean;
    className?: string;
    /** Tailwind height utilities for the mark (e.g. "h-[40px] md:h-[50px]"). Overrides `size`. */
    imgClassName?: string;
}

/** Warm accent on the handle — the one colour not derived from the primary. */
const GOLD = '#E3A72F';

/**
 * The shopping-bag emblem.
 *
 * On a dark surface the bag flips to white with a brand-green monogram:
 * a green bag on the green header would be very close to invisible.
 */
const BagMark: React.FC<{ onDark: boolean; className?: string; style?: React.CSSProperties }> = ({
    onDark,
    className,
    style,
}) => (
    <svg
        viewBox="0 0 64 64"
        className={className}
        style={style}
        role="img"
        aria-label="Mawa Homebazar BD"
    >
        {/* Handle first so the bag's top edge overlaps its ends. */}
        <path
            d="M22 26V20a10 10 0 0 1 20 0v6"
            fill="none"
            stroke={GOLD}
            strokeWidth="4.5"
            strokeLinecap="round"
        />
        <path
            d="M12.5 24h39a3.5 3.5 0 0 1 3.49 3.82l-2.4 26.5A6 6 0 0 1 46.6 60H17.4a6 6 0 0 1-5.98-5.68l-2.4-26.5A3.5 3.5 0 0 1 12.5 24Z"
            fill={onDark ? '#ffffff' : 'var(--color-primary)'}
        />
        {/* M monogram — left leg, valley, right leg. */}
        <path
            d="M23.5 48V36.5l8.5 8 8.5-8V48"
            fill="none"
            stroke={onDark ? 'var(--color-primary)' : '#ffffff'}
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const Logo: React.FC<LogoProps> = ({
    size = 40,
    light = false,
    boxed = false,
    iconOnly = false,
    className,
    imgClassName,
}) => {
    // `boxed` puts the lockup on white, so the dark-surface treatment only
    // applies to the unboxed `light` variant.
    const onDark = light && !boxed;

    // The SVG is square; height drives the width so the callers' existing
    // `h-[36px] md:h-[46px]` classes keep working unchanged.
    const markClass = imgClassName ? `${imgClassName} w-auto` : undefined;
    const markStyle: React.CSSProperties = imgClassName
        ? { display: 'block', aspectRatio: '1 / 1' }
        : { height: size, width: size, display: 'block' };

    if (iconOnly) {
        return (
            <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <BagMark onDark={onDark} className={markClass} style={markStyle} />
            </span>
        );
    }

    const wordmark = (
        <span className="flex flex-col justify-center leading-none">
            <span
                className={`font-heading whitespace-nowrap text-[13px] font-bold uppercase leading-[0.95] tracking-[0.01em] sm:text-[15px] md:text-[17px] ${onDark ? 'text-white' : ''}`}
                style={onDark ? undefined : { color: 'var(--color-primary)' }}
            >
                Mawa Homebazar <span style={{ color: GOLD }}>BD</span>
            </span>
            <span
                className={`mt-[3px] whitespace-nowrap text-[5.5px] font-semibold uppercase leading-none tracking-[0.28em] sm:text-[6px] md:text-[6.5px] ${onDark ? 'text-white/70' : ''}`}
                style={onDark ? undefined : { color: 'var(--color-primary-dark)' }}
            >
                Online Bazar · Bangladesh
            </span>
        </span>
    );

    const lockup = (
        <>
            <BagMark onDark={onDark} className={markClass} style={markStyle} />
            {wordmark}
        </>
    );

    if (boxed) {
        return (
            <span
                className={className}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 9,
                    background: '#fff',
                    borderRadius: 10,
                    padding: '5px 10px',
                }}
            >
                {lockup}
            </span>
        );
    }

    return (
        <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            {lockup}
        </span>
    );
};

/** Compact brand mark — same logo API, used where space is tight. */
export const LogoMark: React.FC<LogoProps> = (props) => <Logo {...props} />;

export default Logo;
