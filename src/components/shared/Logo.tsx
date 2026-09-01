import React from 'react';

/**
 * Safwan · Mawa Homebazar BD brand logo.
 *
 * The artwork ships on a deep maroon background (a JPEG — so it can't be
 * genuinely transparent). To make it read nicely against any surface we sit
 * it inside a soft cream rounded chip; the chip matches the warm page and
 * gives the logo its own island of light on the navy header.
 *
 *  • default        — logo in a cream rounded chip; works on any bg.
 *  • `light`        — same, kept for API compatibility with old call sites.
 *  • `boxed`        — same, kept for API compatibility.
 *  • `iconOnly`     — logo image with no chip and no padding.
 */
interface LogoProps {
    /** Logo height in px (used when `imgClassName` is not set). */
    size?: number;
    /** Kept for API compatibility. */
    light?: boolean;
    /** Kept for API compatibility. */
    boxed?: boolean;
    /** No-op — kept so old call sites don't break. */
    showTagline?: boolean;
    /** Skip the surrounding chip (raw image). */
    iconOnly?: boolean;
    className?: string;
    /** Tailwind height utilities for the mark (e.g. "h-[40px] md:h-[50px]"). Overrides `size`. */
    imgClassName?: string;
}

const LOGO_SRC = '/logo/safwan-logo.jpeg';
const ALT = 'Safwan · Mawa Homebazar BD';

const Logo: React.FC<LogoProps> = ({
    size = 44,
    iconOnly = false,
    className,
    imgClassName,
}) => {
    const imgClass = imgClassName ? `${imgClassName} w-auto` : undefined;
    const imgStyle: React.CSSProperties = imgClassName
        ? { display: 'block', aspectRatio: '1 / 1', objectFit: 'contain', borderRadius: 10 }
        : { height: size, width: size, display: 'block', objectFit: 'contain', borderRadius: 10 };

    /* eslint-disable @next/next/no-img-element */
    const img = (
        <img
            src={LOGO_SRC}
            alt={ALT}
            className={imgClass}
            style={imgStyle}
            draggable={false}
        />
    );
    /* eslint-enable @next/next/no-img-element */

    if (iconOnly) {
        return (
            <span
                className={className}
                style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}
            >
                {img}
            </span>
        );
    }

    // Both the header (white) and the footer (cream) are light surfaces now,
    // so the logo's own maroon JPEG background reads as the emblem itself with
    // no chip needed — just the artwork sitting flush.
    return (
        <span
            className={className}
            style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}
        >
            {img}
        </span>
    );
};

/** Compact brand mark — same logo API, used where space is tight. */
export const LogoMark: React.FC<LogoProps> = (props) => <Logo {...props} />;

export default Logo;
