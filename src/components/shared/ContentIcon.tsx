"use client";

import React from 'react';
import type { IconType } from 'react-icons';
import {
    LuBadgeDollarSign, LuBanknote, LuWallet, LuHandCoins, LuCreditCard, LuCoins,
    LuLandmark, LuDollarSign, LuPiggyBank, LuBadgePercent, LuPercent,
    LuZap, LuBadgeCheck, LuCircleCheck, LuCheck, LuShieldCheck, LuLock,
    LuScanSearch, LuSearch, LuScan,
    LuTruck, LuPackage, LuBoxes, LuBox, LuGift, LuPlane, LuRocket, LuTag, LuWarehouse,
    LuShoppingBag, LuShoppingCart, LuStore, LuBuilding2, LuHouse,
    LuVideo, LuCamera, LuImage,
    LuHeadset, LuHeadphones, LuSmartphone, LuPhone, LuBellRing, LuBell,
    LuMail, LuMessageCircle,
    LuStar, LuSparkles, LuTrophy, LuMedal, LuCrown, LuGem, LuTarget, LuFlame,
    LuLightbulb, LuAward,
    LuHandshake, LuHandHeart, LuUsers, LuUserPlus, LuBriefcase, LuPrinter,
    LuMegaphone, LuTrendingUp, LuChartColumn, LuGlobe,
    LuClock, LuTimer, LuCalendar, LuMapPin, LuHeart, LuThumbsUp,
    LuFileText, LuRefreshCw, LuDownload, LuUpload, LuInfinity, LuSprout,
    LuBrainCircuit, LuSettings, LuWrench, LuPenTool, LuLayers, LuBookOpen,
} from 'react-icons/lu';
import IconTile, { TileShell, toneByIndex, type IconTone } from './IconTile';

/**
 * ContentIcon — turns the admin-entered "icon" string stored on home-section
 * items into a crisp Lucide icon inside the site's tinted tile.
 *
 * The database stores whatever the admin typed — usually an emoji (💰, 🚚, ✅),
 * sometimes a keyword ("truck", "wallet"), occasionally an uploaded image URL.
 * Raw emoji render inconsistently across devices and clash with the Lucide look
 * used everywhere else, so we map every known emoji / keyword to a real Lucide
 * icon here. Nothing in the database has to change — existing content simply
 * starts rendering as clean vector icons.
 *
 * Priority: uploaded image URL → keyword match → emoji match → fallback icon.
 */

/* Emoji → Lucide. Keys are stored WITHOUT the U+FE0F "emoji presentation"
   variation selector; the resolver strips it before lookup so both "☎️" and
   "☎" resolve. */
const EMOJI: Record<string, IconType> = {
    // money / payments
    '💰': LuBadgeDollarSign, '🤑': LuBadgeDollarSign,
    '💵': LuBanknote, '💴': LuBanknote, '💶': LuBanknote, '💷': LuBanknote,
    '💳': LuCreditCard, '🪙': LuCoins, '💸': LuHandCoins, '🏦': LuLandmark,
    '💲': LuDollarSign, '🐷': LuPiggyBank, '🐖': LuPiggyBank,
    // energy / instant
    '⚡': LuZap, '🔌': LuZap,
    // verified / trust / security
    '✅': LuBadgeCheck, '✔': LuBadgeCheck, '☑': LuBadgeCheck,
    '🛡': LuShieldCheck, '🔒': LuLock, '🔐': LuLock, '🔏': LuLock,
    // search
    '🔍': LuScanSearch, '🔎': LuSearch,
    // delivery / logistics
    '🚚': LuTruck, '🚛': LuTruck, '🛻': LuTruck, '🚐': LuTruck,
    '📦': LuPackage, '🎁': LuGift, '✈': LuPlane, '🚀': LuRocket, '🏷': LuTag,
    // shopping / stores
    '🛍': LuShoppingBag, '🛒': LuShoppingCart, '🏪': LuStore, '🏬': LuStore,
    '🏢': LuBuilding2, '🏠': LuHouse, '🏡': LuHouse,
    // media
    '🎥': LuVideo, '🎬': LuVideo, '📹': LuVideo, '📽': LuVideo,
    '📷': LuCamera, '📸': LuCamera, '🖼': LuImage,
    // support / contact
    '☎': LuHeadset, '📞': LuHeadset, '📱': LuSmartphone, '🎧': LuHeadphones,
    '🛎': LuBellRing, '🔔': LuBell, '📧': LuMail, '✉': LuMail, '📨': LuMail,
    '💬': LuMessageCircle, '🗨': LuMessageCircle,
    // quality / rewards
    '⭐': LuStar, '🌟': LuSparkles, '✨': LuSparkles, '💫': LuSparkles,
    '🏆': LuTrophy, '🥇': LuMedal, '🏅': LuMedal, '👑': LuCrown, '💎': LuGem,
    '🎯': LuTarget, '🔥': LuFlame, '💡': LuLightbulb,
    // people / business
    '🤝': LuHandshake, '🫶': LuHandHeart, '👤': LuUsers, '👥': LuUsers,
    '🧑': LuUsers, '👨': LuUsers, '👩': LuUsers, '💼': LuBriefcase, '🖨': LuPrinter,
    '📢': LuMegaphone, '📣': LuMegaphone, '📈': LuTrendingUp, '📊': LuChartColumn,
    '🌐': LuGlobe, '🌍': LuGlobe, '🌎': LuGlobe, '🌏': LuGlobe,
    // time / place / misc
    '⏰': LuClock, '🕐': LuClock, '⌚': LuClock, '⏱': LuTimer,
    '📅': LuCalendar, '📆': LuCalendar, '📍': LuMapPin,
    '❤': LuHeart, '♥': LuHeart, '👍': LuThumbsUp,
    '📝': LuFileText, '📄': LuFileText, '📃': LuFileText,
    '🔄': LuRefreshCw, '♻': LuRefreshCw, '⬇': LuDownload, '📥': LuDownload,
    '⬆': LuUpload, '📤': LuUpload, '♾': LuInfinity, '🌱': LuSprout,
    '🧠': LuBrainCircuit, '⚙': LuSettings, '🔧': LuWrench, '✏': LuPenTool,
    '📚': LuBookOpen, '🎓': LuBookOpen,
};

/* Keyword / slug → Lucide, so an admin can also type a plain word instead of an
   emoji. Matched case-insensitively on the whole trimmed string. */
const KEYWORDS: Record<string, IconType> = {
    // money
    money: LuBadgeDollarSign, cash: LuBanknote, banknote: LuBanknote, payment: LuBanknote,
    wallet: LuWallet, coins: LuCoins, coin: LuCoins, card: LuCreditCard, creditcard: LuCreditCard,
    bank: LuLandmark, dollar: LuDollarSign, taka: LuBadgeDollarSign, profit: LuBadgeDollarSign,
    'zero-investment': LuHandCoins, investment: LuHandCoins, free: LuGift,
    discount: LuBadgePercent, offer: LuBadgePercent, percent: LuPercent,
    // instant / energy
    instant: LuZap, zap: LuZap, fast: LuZap, lightning: LuZap, quick: LuZap, boost: LuRocket, boosting: LuRocket,
    // verified / trust
    verified: LuBadgeCheck, verify: LuBadgeCheck, check: LuBadgeCheck, quality: LuBadgeCheck,
    trusted: LuShieldCheck, shield: LuShieldCheck, secure: LuShieldCheck, security: LuShieldCheck,
    safe: LuShieldCheck, lock: LuLock,
    // search
    search: LuSearch, 'image-search': LuScanSearch, scan: LuScan,
    // delivery
    truck: LuTruck, delivery: LuTruck, shipping: LuTruck, ship: LuTruck, courier: LuTruck,
    package: LuPackage, box: LuPackage, parcel: LuPackage, wholesale: LuBoxes, warehouse: LuWarehouse,
    gift: LuGift, plane: LuPlane, rocket: LuRocket, tag: LuTag,
    // shopping
    bag: LuShoppingBag, cart: LuShoppingCart, shop: LuStore, store: LuStore,
    ecommerce: LuShoppingCart, reselling: LuShoppingBag, dropshipping: LuShoppingBag,
    building: LuBuilding2, company: LuBuilding2, home: LuHouse,
    // media
    video: LuVideo, camera: LuCamera, image: LuImage, photo: LuImage, media: LuVideo,
    // support / contact
    support: LuHeadset, headset: LuHeadset, call: LuHeadset, callcenter: LuHeadset,
    phone: LuSmartphone, mobile: LuSmartphone, recharge: LuSmartphone, headphones: LuHeadphones,
    bell: LuBell, notification: LuBell, mail: LuMail, email: LuMail, message: LuMessageCircle, chat: LuMessageCircle,
    // quality / rewards
    star: LuStar, sparkle: LuSparkles, sparkles: LuSparkles, premium: LuSparkles,
    trophy: LuTrophy, award: LuAward, medal: LuMedal, crown: LuCrown, leadership: LuCrown, leader: LuCrown,
    diamond: LuGem, gem: LuGem, target: LuTarget, fire: LuFlame, trending: LuTrendingUp, idea: LuLightbulb,
    // people / business
    handshake: LuHandshake, supplier: LuHandshake, vendor: LuHandshake, vendorship: LuHandshake, partner: LuHandshake,
    users: LuUsers, customer: LuUsers, customers: LuUsers, community: LuUsers, reseller: LuUsers, team: LuUsers,
    signup: LuUserPlus, register: LuUserPlus,
    briefcase: LuBriefcase, job: LuBriefcase, jobs: LuBriefcase, freelance: LuBriefcase, freelancing: LuBriefcase,
    print: LuPrinter, printer: LuPrinter,
    marketing: LuMegaphone, megaphone: LuMegaphone, ads: LuMegaphone, promotion: LuMegaphone, digital: LuMegaphone,
    chart: LuChartColumn, analytics: LuChartColumn, growth: LuTrendingUp,
    globe: LuGlobe, web: LuGlobe, website: LuGlobe, worldwide: LuGlobe, world: LuGlobe, online: LuGlobe,
    // time / misc
    clock: LuClock, time: LuClock, timer: LuTimer, calendar: LuCalendar, schedule: LuCalendar,
    location: LuMapPin, address: LuMapPin, map: LuMapPin, heart: LuHeart, like: LuThumbsUp,
    document: LuFileText, invoice: LuFileText, refund: LuRefreshCw, refresh: LuRefreshCw, return: LuRefreshCw,
    download: LuDownload, downloads: LuDownload, upload: LuUpload,
    settings: LuSettings, service: LuWrench, services: LuWrench, tools: LuWrench, custom: LuPenTool,
    book: LuBookOpen, learn: LuBookOpen, layers: LuLayers, micro: LuLayers,
};

const EMOJI_MODIFIERS = new Set([0xFE0E, 0xFE0F, 0x200D]); // text VS, emoji VS, ZWJ
/** Strip presentation selectors so "☎️" and "☎" resolve the same. */
function stripEmojiModifiers(t: string): string {
    return Array.from(t).filter((c) => !EMOJI_MODIFIERS.has(c.codePointAt(0) ?? 0)).join('');
}

/** Resolve a stored icon token to a Lucide icon, or null if unknown. */
export function resolveContentIcon(raw?: string | null): IconType | null {
    if (!raw) return null;
    const token = String(raw).trim();
    if (!token) return null;

    // A keyword / slug (letters, spaces, dashes) — match the whole thing.
    const key = token.toLowerCase();
    if (KEYWORDS[key]) return KEYWORDS[key];
    const slug = key.replace(/[\s_]+/g, '-');
    if (KEYWORDS[slug]) return KEYWORDS[slug];

    // An emoji — try as-is, then with the variation selectors / ZWJ stripped
    // (U+FE0E text, U+FE0F emoji, U+200D zero-width joiner).
    if (EMOJI[token]) return EMOJI[token];
    const bare = stripEmojiModifiers(token);
    if (EMOJI[bare]) return EMOJI[bare];
    // Fall back to the first character cluster (handles "🚚 Fast delivery" style).
    const first = Array.from(bare)[0];
    if (first && EMOJI[first]) return EMOJI[first];

    return null;
}

interface ContentIconProps {
    /** Raw stored token: emoji, keyword, or image URL. */
    icon?: string | null;
    /** Position in the list — cycles the tile colour when no explicit tone. */
    index?: number;
    /** Force a tile tone instead of the index-cycled one. */
    tone?: IconTone;
    /** Outer tile size in px. */
    size?: number;
    /** Icon glyph size in px. */
    iconSize?: number;
    /** Corner radius in px (pass a large value like 999 for a circle). */
    radius?: number;
    className?: string;
    style?: React.CSSProperties;
    /** Lucide icon used when the token can't be resolved (default ✨ sparkles). */
    fallbackIcon?: IconType;
}

const URL_RE = /^(https?:)?\/\/|^\/|^data:/i;

/**
 * Drop-in replacement for the old `<span>{it.icon}</span>` emoji tiles. Renders
 * the resolved Lucide icon (or an uploaded image, or a graceful fallback icon)
 * inside the shared tinted tile.
 */
export const ContentIcon: React.FC<ContentIconProps> = ({
    icon,
    index = 0,
    tone,
    size = 48,
    iconSize,
    radius,
    className,
    style,
    fallbackIcon = LuSparkles,
}) => {
    const resolvedTone = tone ?? toneByIndex(index);
    const token = icon ? String(icon).trim() : '';

    // A real uploaded image URL — keep showing it, just inside the tile.
    if (token && URL_RE.test(token)) {
        const glyph = iconSize ?? Math.round(size * 0.58);
        return (
            <TileShell tone={resolvedTone} size={size} radius={radius} className={className} style={style}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={token} alt="" style={{ width: glyph, height: glyph, objectFit: 'contain' }} />
            </TileShell>
        );
    }

    const Icon = resolveContentIcon(token) ?? fallbackIcon;
    return (
        <IconTile
            icon={Icon}
            tone={resolvedTone}
            size={size}
            iconSize={iconSize}
            radius={radius}
            className={className}
            style={style}
        />
    );
};

export default ContentIcon;
