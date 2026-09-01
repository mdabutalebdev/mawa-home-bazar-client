"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/redux';
import { logout } from '@/redux/slices/authSlice';
import { LuMapPin, LuMail, LuPhone } from 'react-icons/lu';
import { FaFacebookF, FaLinkedinIn, FaYoutube, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter, FaTiktok } from 'react-icons/fa6';
import { toast } from 'react-hot-toast';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import Logo from '@/components/shared/Logo';
import type { IconType } from 'react-icons';

const SOCIAL_ICONS: { match: string; icon: IconType }[] = [
    { match: 'facebook', icon: FaFacebookF },
    { match: 'instagram', icon: FaInstagram },
    { match: 'youtube', icon: FaYoutube },
    { match: 'linkedin', icon: FaLinkedinIn },
    { match: 'twitter', icon: FaXTwitter },
    { match: 'tiktok', icon: FaTiktok },
    { match: 'whatsapp', icon: FaWhatsapp },
];

const getSocialIcon = (label: string): IconType => {
    const found = SOCIAL_ICONS.find((s) => label.toLowerCase().includes(s.match));
    return found?.icon || FaFacebookF;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const NewFooter: React.FC = () => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { data: siteRes } = useGetSiteContentQuery({});
    const { lang } = useLanguage();
    const isBn = lang === 'bn';

    /* Simple in-file translation table for the footer — keeps the labels
       tightly next to the markup they're used in, so a copy tweak doesn't
       cost a round-trip through the shared dictionary. Bangla is intentionally
       everyday-plain, not literary. */
    const T = {
        tagline: isBn
            ? 'বাংলাদেশের বিশ্বস্ত অনলাইন মার্কেটপ্লেস — কম দামে ভালো প্রোডাক্ট, দেশজুড়ে ফাস্ট ডেলিভারি।'
            : 'A trusted online marketplace across Bangladesh — quality products at fair prices, delivered fast.',
        quickLinks: isBn ? 'কুইক লিংক' : 'Quick Links',
        support:    isBn ? 'সাপোর্ট'   : 'Support',
        weAccept:   isBn ? 'পেমেন্ট'   : 'We Accept',
        home:       isBn ? 'হোম'                    : 'Home',
        allProducts:isBn ? 'সব প্রোডাক্ট'          : 'All Products',
        track:      isBn ? 'অর্ডার ট্র্যাক'         : 'Track Order',
        companies:  isBn ? 'কোম্পানি'              : 'Companies',
        dealers:    isBn ? 'ডিলার খুঁজুন'          : 'Find a Dealer',
        contact:    isBn ? 'যোগাযোগ'               : 'Contact Us',
        liveChat:   isBn ? 'লাইভ চ্যাট (হোয়াটসঅ্যাপ)' : 'Live Chat (WhatsApp)',
        myAccount:  isBn ? 'আমার অ্যাকাউন্ট'       : 'My Account',
        signIn:     isBn ? 'সাইন ইন / রেজিস্টার'   : 'Sign In / Register',
        subTitle:   isBn ? 'অফার সবার আগে পেতে' : 'Subscribe for updates',
        subText:    isBn ? 'নতুন অফার, ছাড় ও নতুন প্রোডাক্টের খবর ইনবক্সে সরাসরি পাবেন।' : 'Get new offers, discounts and product updates in your inbox.',
        emailPlaceholder: isBn ? 'আপনার ইমেইল' : 'Your email',
        subscribe:  isBn ? 'সাবস্ক্রাইব'   : 'Subscribe',
        subscribing:isBn ? 'হচ্ছে…'        : 'Subscribing…',
        developedBy:isBn ? 'ডেভেলপ করেছে' : 'Developed by',
    };

    // ── Newsletter subscribe ──
    const [email, setEmail] = React.useState('');
    const [subscribing, setSubscribing] = React.useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = email.trim();
        if (!value) { toast.error(isBn ? 'ইমেইল দিন' : 'Please enter your email'); return; }
        setSubscribing(true);
        try {
            const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: value }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.message || 'Subscription failed');
            toast.success(json?.message || (isBn ? 'ধন্যবাদ! সাবস্ক্রাইব সম্পন্ন হয়েছে।' : 'Subscribed! Thanks for joining.'));
            setEmail('');
        } catch (err: any) {
            toast.error(err?.message || 'Subscription failed. Please try again.');
        } finally {
            setSubscribing(false);
        }
    };

    // Show every social the admin has toggled ACTIVE — regardless of whether a
    // URL has been filled in yet. Inactive ones never render. (Old logic keyed
    // off the URL, which hid links the admin had switched on but not yet
    // pasted an address for.)
    const socials: { label: string; url: string; active?: boolean }[] =
        (siteRes?.data?.contact?.socials || []).filter((s: any) => s?.active !== false && s?.label);

    const contact = siteRes?.data?.contact || {};
    const phoneList: string[] = (Array.isArray(contact.phones) && contact.phones.length > 0)
        ? contact.phones
        : (contact.phone ? [contact.phone] : []);
    const contactEmail: string = contact.email || contact.emails?.[0] || '';
    const address: string = contact.address || contact.corporateOffice || '';

    const waDigits = (siteRes?.data?.contact?.whatsapp || siteRes?.data?.floating?.whatsapp || '').replace(/\D/g, '');
    const waNumber = !waDigits ? '' : waDigits.startsWith('880') ? waDigits : waDigits.startsWith('0') ? '88' + waDigits : '880' + waDigits;
    const whatsappLink = waNumber ? `https://wa.me/${waNumber}` : '';

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        toast.success('Logged out successfully');
        router.push('/');
    };

    /* Full-navy footer: white text on deep navy, yellow used as the accent
       colour for phone numbers and hovers so the maroon primary is never
       used in the footer at all. */
    const NAVY = '#0A2148';
    const YELLOW = '#FBBF00';
    const linkCls = 'text-sm text-white/75 hover:text-white transition-colors';

    return (
        <footer style={{ background: NAVY }}>
            {/* Main footer band — deep navy from edge to edge. */}
            <div style={{ background: NAVY }}>
                <div className="container mx-auto px-4 py-8">
                    <div className="grid gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-12">

                        {/* Brand column — logo + tagline + address + socials */}
                        <div className="sm:col-span-2 lg:col-span-4">
                            <div className="mb-3">
                                <Logo imgClassName="h-[52px] md:h-[60px]" />
                            </div>
                            <p className="text-sm text-white/75 leading-relaxed max-w-sm">
                                {T.tagline}
                            </p>

                            {(address || contactEmail || phoneList[0]) && (
                                <ul className="mt-5 space-y-2">
                                    {address && (
                                        <li className="flex items-start gap-2.5 text-sm text-white/85">
                                            <LuMapPin size={15} className="mt-0.5 shrink-0" style={{ color: YELLOW }} />
                                            <span>{address}</span>
                                        </li>
                                    )}
                                    {phoneList[0] && (
                                        <li className="flex items-center gap-2.5 text-sm">
                                            <LuPhone size={15} className="shrink-0" style={{ color: YELLOW }} />
                                            <a href={`tel:${phoneList[0]}`} className="font-semibold text-white hover:text-white/80 transition-colors">
                                                {phoneList[0]}
                                            </a>
                                        </li>
                                    )}
                                    {contactEmail && (
                                        <li className="flex items-center gap-2.5 text-sm text-white/85">
                                            <LuMail size={15} className="shrink-0" style={{ color: YELLOW }} />
                                            <a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors break-all">
                                                {contactEmail}
                                            </a>
                                        </li>
                                    )}
                                </ul>
                            )}

                            {socials.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2.5 mt-5">
                                    {socials.map((s, i) => {
                                        const Icon = getSocialIcon(s.label);
                                        const hasUrl = !!s.url && s.url !== '#';
                                        return (
                                            <a
                                                key={`${s.label}-${i}`}
                                                href={hasUrl ? s.url : '#'}
                                                {...(hasUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                                aria-label={s.label}
                                                title={s.label}
                                                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:-translate-y-0.5"
                                                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
                                            >
                                                <Icon size={15} />
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Quick Links */}
                        <div className="lg:col-span-2">
                            <h4 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wide">{T.quickLinks}</h4>
                            <ul className="space-y-2.5">
                                <li><Link href="/" className={linkCls}>{T.home}</Link></li>
                                <li><Link href="/products" className={linkCls}>{T.allProducts}</Link></li>
                                <li><Link href="/track" className={linkCls}>{T.track}</Link></li>
                                <li><Link href="/companies" className={linkCls}>{T.companies}</Link></li>
                                <li><Link href="/dealers" className={linkCls}>{T.dealers}</Link></li>
                                <li><Link href="/contact" className={linkCls}>{T.contact}</Link></li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div className="lg:col-span-3">
                            <h4 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wide">{T.support}</h4>
                            <ul className="space-y-2.5">
                                {phoneList.slice(1).map((p) => (
                                    <li key={p}>
                                        <a href={`tel:${p}`} className={linkCls}>
                                            <LuPhone size={12} className="inline mr-1.5 align-middle" /> {p}
                                        </a>
                                    </li>
                                ))}
                                {whatsappLink && (
                                    <li>
                                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={linkCls}>
                                            <FaWhatsapp className="inline mr-1.5 align-middle" size={12} />
                                            {T.liveChat}
                                        </a>
                                    </li>
                                )}
                                {isAuthenticated ? (
                                    <>
                                        <li>
                                            <Link href={user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/user'} className={linkCls}>
                                                {T.myAccount}
                                            </Link>
                                        </li>
                                        <li>
                                            <button onClick={handleLogout} className={linkCls} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
                                                {isBn ? 'লগআউট' : 'Logout'}
                                            </button>
                                        </li>
                                    </>
                                ) : (
                                    <li><Link href="/login" className={linkCls}>{T.signIn}</Link></li>
                                )}
                                <li><Link href="/terms" className={linkCls}>{isBn ? 'শর্তাবলি' : 'Terms & Conditions'}</Link></li>
                                <li><Link href="/privacy" className={linkCls}>{isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</Link></li>
                                <li><Link href="/refund" className={linkCls}>{isBn ? 'রিফান্ড নীতি' : 'Refund Policy'}</Link></li>
                            </ul>
                        </div>

                        {/* Newsletter + payments */}
                        <div className="lg:col-span-3">
                            <h4 className="text-sm font-extrabold text-white mb-3 uppercase tracking-wide">{T.subTitle}</h4>
                            <p className="text-xs text-white/70 mb-3 leading-relaxed">{T.subText}</p>
                            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={T.emailPlaceholder}
                                    aria-label="Email address"
                                    disabled={subscribing}
                                    className="w-full rounded-md border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/40 disabled:opacity-60"
                                />
                                <button
                                    type="submit"
                                    disabled={subscribing}
                                    className="w-full rounded-md px-5 py-2.5 text-sm font-bold disabled:opacity-60"
                                    style={{ background: YELLOW, color: NAVY }}
                                >
                                    {subscribing ? T.subscribing : T.subscribe}
                                </button>
                            </form>

                            <div className="mt-6">
                                <h4 className="text-[11px] font-extrabold text-white mb-2 uppercase tracking-wide">{T.weAccept}</h4>
                                {/* SSLCommerz "Pay With" strip — a white rounded panel so the
                                    logos stay legible on the dark navy footer. */}
                                <div className="rounded-lg bg-white p-2.5 shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="/payment-methods.png"
                                        alt="Accepted payment methods — Visa, Mastercard, American Express, bKash, Rocket, Nagad and more via SSLCommerz"
                                        className="w-full h-auto"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright strip — same navy, a hairline separates it. */}
            <div style={{ background: NAVY, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                        <p className="text-xs text-white/60">
                            © {new Date().getFullYear()} Safwan · Mawa Homebazar BD.
                        </p>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-white/60">
                                {T.developedBy}{' '}
                                <a
                                    href="https://www.extrainweb.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-white/85 hover:text-white transition-colors"
                                >
                                    Extrain Web
                                </a>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default NewFooter;
