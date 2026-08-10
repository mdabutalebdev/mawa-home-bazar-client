"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    LuBuilding2, LuPhone, LuMail, LuGlobe, LuMapPin, LuFileText, LuUpload,
    LuX, LuCheck, LuChevronRight, LuTruck, LuStore, LuUsers, LuLayoutDashboard,
    LuClock, LuCircleCheck, LuCircleAlert, LuLogIn, LuPackage, LuWrench,
    LuArrowRight, LuShieldCheck, LuMessageCircle, LuLayoutGrid,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '@/redux';
import { useApplyCompanyMutation, useGetMyCompanyQuery } from '@/redux/api/companyApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useUploadImageMutation } from '@/redux/api/uploadApi';
import AreaSelect, { AreaValue } from '@/components/shared/AreaSelect';

/* ─── Types ─── */
interface Category {
    _id: string;
    name: string;
    slug?: string;
}

type FormState = {
    name: string;
    type: 'product' | 'service';
    description: string;
    about: string;
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
    address: string;
    tradeLicense: string;
    tin: string;
    bin: string;
    logo: string;
};

const emptyForm: FormState = {
    name: '', type: 'product', description: '', about: '',
    phone: '', whatsapp: '', email: '', website: '',
    address: '', tradeLicense: '', tin: '', bin: '', logo: '',
};

const BD_PHONE = /^01\d{9}$/;
const REDIRECT = '/join/company';

/* ─── Shared classes ─── */
const inputCls =
    'w-full text-sm px-3.5 py-3 rounded-xl border border-gray-200 bg-white outline-none ' +
    'placeholder:text-gray-400 transition-colors focus:border-[var(--color-primary)] ' +
    'focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5';
const errCls = 'text-xs text-red-500 mt-1.5';

const BENEFITS = [
    { icon: LuTruck, title: 'Reach every upazila', text: 'Your products go on sale across the whole dealer network, not just your own district.' },
    { icon: LuPhone, title: 'Dealers confirm by phone', text: 'The local dealer calls the customer and confirms each order before it ships — fewer returns for you.' },
    { icon: LuStore, title: 'Retailers buy wholesale', text: 'Registered shops order from you in bulk at your own wholesale rates.' },
    { icon: LuUsers, title: 'Your own storefront page', text: 'A public page with your logo, catalogue and contact details that you control.' },
];

export default function JoinCompanyPage() {
    const { isAuthenticated, user, isRestoring } = useAppSelector((s) => s.auth);

    const { data: mineRes, isLoading: mineLoading } = useGetMyCompanyQuery(undefined, {
        skip: !isAuthenticated,
    });
    const { data: catRes, isLoading: catLoading } = useGetCategoriesQuery({ limit: 200 });
    const [applyCompany, { isLoading: applying }] = useApplyCompanyMutation();
    const [uploadImage, { isLoading: uploading }] = useUploadImageMutation();

    const [form, setForm] = useState<FormState>(emptyForm);
    const [area, setArea] = useState<AreaValue>({});
    const [categories, setCategories] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileRef = useRef<HTMLInputElement>(null);

    const myCompany = mineRes?.data || null;
    const catList: Category[] = catRes?.data || [];

    // The applicant is already signed in, so their own contact details are the
    // best first guess for the company's — they can still overwrite both.
    useEffect(() => {
        if (!user) return;
        setForm((f) => ({
            ...f,
            phone: f.phone || user.phone || '',
            email: f.email || user.email || '',
        }));
    }, [user]);

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
        setForm((f) => ({ ...f, [k]: v }));
        if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
    };

    const toggleCategory = (id: string) =>
        setCategories((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

    const handleLogo = async (file?: File | null) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('Logo must be under 5MB'); return; }
        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await uploadImage(fd).unwrap();
            set('logo', res.data.url);
            toast.success('Logo uploaded');
        } catch {
            toast.error('Logo upload failed. Try again.');
        }
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Company name is required';
        if (!BD_PHONE.test(form.phone.trim())) e.phone = 'Enter a valid number — 01XXXXXXXXX';
        if (form.whatsapp.trim() && !BD_PHONE.test(form.whatsapp.trim())) e.whatsapp = 'Enter a valid number — 01XXXXXXXXX';
        if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email.trim())) e.email = 'Enter a valid email address';
        if (!form.address.trim()) e.address = 'Head office address is required';
        return e;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            toast.error('Please fix the highlighted fields');
            return;
        }
        try {
            await applyCompany({
                name: form.name.trim(),
                type: form.type,
                logo: form.logo,
                description: form.description.trim(),
                about: form.about.trim(),
                categories,
                phone: form.phone.trim(),
                whatsapp: form.whatsapp.trim(),
                email: form.email.trim(),
                website: form.website.trim(),
                address: form.address.trim(),
                // A company trades nationwide, so the head-office area is optional —
                // send the keys only when they are actually filled in.
                ...(area.division ? { division: area.division } : {}),
                ...(area.district ? { district: area.district } : {}),
                ...(area.upazila ? { upazila: area.upazila } : {}),
                tradeLicense: form.tradeLicense.trim(),
                tin: form.tin.trim(),
                bin: form.bin.trim(),
            }).unwrap();
            toast.success('Application submitted! We will review it shortly.');
            setForm(emptyForm);
            setArea({});
            setCategories([]);
        } catch (err) {
            const msg = (err as { data?: { message?: string } })?.data?.message;
            toast.error(msg || 'Could not submit your application. Please try again.');
        }
    };

    /* ══════════ Shell ══════════ */
    const Hero = (
        <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-[rgba(var(--color-primary-rgb),0.07)] to-white">
            <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
                <nav className="mb-4 flex items-center gap-1.5 text-xs text-gray-400">
                    <Link href="/" className="hover:text-[var(--color-primary)]">Home</Link>
                    <LuChevronRight size={12} />
                    <span className="font-medium text-gray-600">Become a Supplier</span>
                </nav>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-primary-rgb),0.1)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    <LuBuilding2 size={12} /> For companies
                </span>
                <h1 className="mt-3 text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl">
                    Sell your products across all of Bangladesh
                </h1>
                <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-gray-500">
                    Register your company as a supplier on Mawa Homebazar BD. Our dealer network
                    delivers to every upazila and confirms your orders on the phone before they ship.
                </p>
            </div>
        </div>
    );

    const Sidebar = (
        <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-gray-900">Why suppliers join us</h2>
                <ul className="space-y-4">
                    {BENEFITS.map((b) => (
                        <li key={b.title} className="flex gap-3">
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                                <b.icon size={16} />
                            </span>
                            <div>
                                <p className="text-[13px] font-bold text-gray-800">{b.title}</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{b.text}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-gray-700">
                    <LuShieldCheck size={15} className="text-[var(--color-primary)]" />
                    <p className="text-[13px] font-bold">What happens next</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    We check your details and call you on the number you provide. Approval usually
                    takes 1–2 working days. Once approved you get a company dashboard where you can
                    add products and track orders.
                </p>
            </div>
        </aside>
    );

    /* ── State 1: not signed in ── */
    if (!isRestoring && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-white">
                {Hero}
                <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-10">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                            <LuLogIn size={24} />
                        </div>
                        <h2 className="mt-4 text-lg font-bold text-gray-900">Sign in to apply</h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                            Your company profile is attached to your account, so you need to be
                            logged in before you can send an application.
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Link
                                href={`/login?redirect=${encodeURIComponent(REDIRECT)}`}
                                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
                            >
                                Log in <LuArrowRight size={15} />
                            </Link>
                            <Link
                                href={`/register?redirect=${encodeURIComponent(REDIRECT)}`}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 px-6 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                            >
                                Create an account
                            </Link>
                        </div>
                    </div>
                    {Sidebar}
                </div>
            </div>
        );
    }

    /* ── Loading: session restore or existing-application check ── */
    if (isRestoring || mineLoading) {
        return (
            <div className="min-h-screen bg-white">
                {Hero}
                <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="animate-pulse space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="h-5 w-44 rounded bg-gray-200" />
                        <div className="h-12 rounded-xl bg-gray-100" />
                        <div className="h-12 rounded-xl bg-gray-100" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="h-12 rounded-xl bg-gray-100" />
                            <div className="h-12 rounded-xl bg-gray-100" />
                        </div>
                        <div className="h-28 rounded-xl bg-gray-100" />
                    </div>
                    <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
                </div>
            </div>
        );
    }

    /* ── State 2: already applied ── */
    if (myCompany) {
        const status: string = myCompany.status || 'pending';
        const views: Record<string, { icon: IconType; tone: string; title: string; text: string }> = {
            pending: {
                icon: LuClock,
                tone: 'text-amber-600 bg-amber-50 border-amber-100',
                title: 'Your application is under review',
                text: 'We are checking your company details. Our team will call you on the number you gave us within 1–2 working days.',
            },
            approved: {
                icon: LuCircleCheck,
                tone: 'text-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.08)] border-[rgba(var(--color-primary-rgb),0.2)]',
                title: 'Your company is approved',
                text: 'You can now add products, set wholesale rates and track orders from your company dashboard.',
            },
            rejected: {
                icon: LuCircleAlert,
                tone: 'text-red-600 bg-red-50 border-red-100',
                title: 'Your application was not approved',
                text: myCompany.rejectionReason || 'Please contact our support team if you would like to apply again.',
            },
            suspended: {
                icon: LuCircleAlert,
                tone: 'text-red-600 bg-red-50 border-red-100',
                title: 'Your company account is suspended',
                text: 'Selling is paused for now. Please contact support to sort this out.',
            },
        };
        const view = views[status] || {
            icon: LuClock,
            tone: 'text-gray-600 bg-gray-50 border-gray-100',
            title: 'Application received',
            text: 'We will get back to you soon.',
        };
        const StatusIcon = view.icon;

        return (
            <div className="min-h-screen bg-white">
                {Hero}
                <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                        <div className={`flex items-start gap-3 rounded-xl border p-4 ${view.tone}`}>
                            <StatusIcon size={20} className="mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold">{view.title}</p>
                                <p className="mt-1 text-xs leading-relaxed opacity-90">{view.text}</p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3 border-t border-gray-50 pt-6">
                            <div className="flex items-center gap-3">
                                {myCompany.logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={myCompany.logo} alt={myCompany.name} className="h-12 w-12 rounded-xl border border-gray-100 object-cover" />
                                ) : (
                                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                                        <LuBuilding2 size={20} />
                                    </span>
                                )}
                                <div className="min-w-0">
                                    <p className="truncate text-base font-bold text-gray-900">{myCompany.name}</p>
                                    <p className="text-xs capitalize text-gray-400">
                                        {myCompany.type === 'service' ? 'Service provider' : 'Product supplier'}
                                        {myCompany.phone ? ` · ${myCompany.phone}` : ''}
                                    </p>
                                </div>
                            </div>
                            {myCompany.address && (
                                <p className="flex items-start gap-2 text-xs text-gray-500">
                                    <LuMapPin size={13} className="mt-0.5 flex-shrink-0 text-gray-300" />
                                    {myCompany.address}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            {status === 'approved' ? (
                                <Link
                                    href="/dashboard/company"
                                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
                                >
                                    <LuLayoutDashboard size={16} /> Go to company dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/contact"
                                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
                                >
                                    <LuMessageCircle size={16} /> Contact support
                                </Link>
                            )}
                            <Link
                                href="/"
                                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 px-6 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                            >
                                Back to shop
                            </Link>
                        </div>
                    </div>
                    {Sidebar}
                </div>
            </div>
        );
    }

    /* ── State 3: the application form ── */
    return (
        <div className="min-h-screen bg-white">
            {Hero}

            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <form onSubmit={handleSubmit} noValidate className="space-y-5">

                    {/* ── Business identity ── */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                                <LuBuilding2 size={17} />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">Your company</h2>
                                <p className="text-xs text-gray-400">Tell customers who you are</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Company name <span className="text-red-500">*</span></label>
                                <input
                                    className={inputCls}
                                    value={form.name}
                                    onChange={(e) => set('name', e.target.value)}
                                    placeholder="e.g. Rahim Traders Ltd."
                                />
                                {errors.name && <p className={errCls}>{errors.name}</p>}
                            </div>

                            {/* Type */}
                            <div>
                                <label className={labelCls}>What does your company do?</label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {([
                                        { v: 'product', icon: LuPackage, title: 'We sell goods', sub: 'Products you ship to customers' },
                                        { v: 'service', icon: LuWrench, title: 'We provide services', sub: 'Installation, repair, maintenance' },
                                    ] as const).map((o) => {
                                        const active = form.type === o.v;
                                        return (
                                            <label
                                                key={o.v}
                                                className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                                                    active
                                                        ? 'border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.06)]'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    className="sr-only"
                                                    checked={active}
                                                    onChange={() => set('type', o.v)}
                                                />
                                                <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-[var(--color-primary)]' : 'border-gray-300'}`}>
                                                    {active && <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="flex items-center gap-1.5 text-[13px] font-bold text-gray-800">
                                                        <o.icon size={14} className={active ? 'text-[var(--color-primary)]' : 'text-gray-400'} />
                                                        {o.title}
                                                    </span>
                                                    <span className="mt-0.5 block text-xs text-gray-400">{o.sub}</span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Short tagline</label>
                                <input
                                    className={inputCls}
                                    value={form.description}
                                    onChange={(e) => set('description', e.target.value)}
                                    placeholder="One line customers see under your name"
                                />
                            </div>

                            <div>
                                <label className={labelCls}>About your company</label>
                                <textarea
                                    rows={4}
                                    className={`${inputCls} resize-y min-h-[110px]`}
                                    value={form.about}
                                    onChange={(e) => set('about', e.target.value)}
                                    placeholder="What you make or supply, how long you have been in business, who you serve..."
                                />
                            </div>

                            {/* Logo */}
                            <div>
                                <label className={labelCls}>Company logo</label>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => { handleLogo(e.target.files?.[0]); e.target.value = ''; }}
                                />
                                {form.logo ? (
                                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={form.logo} alt="Company logo" className="h-16 w-16 rounded-lg border border-gray-100 object-cover" />
                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700">
                                                <LuCheck size={14} className="text-[var(--color-primary)]" /> Logo uploaded
                                            </p>
                                            <div className="mt-1.5 flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => fileRef.current?.click()}
                                                    className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                                                >
                                                    Replace
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => set('logo', '')}
                                                    className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"
                                                >
                                                    <LuX size={12} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={() => fileRef.current?.click()}
                                        className="flex min-h-[96px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center transition-colors hover:border-[var(--color-primary)] disabled:opacity-60"
                                    >
                                        {uploading ? (
                                            <>
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-primary)]" />
                                                <span className="text-xs font-semibold text-gray-500">Uploading…</span>
                                            </>
                                        ) : (
                                            <>
                                                <LuUpload size={20} className="text-gray-400" />
                                                <span className="text-xs font-semibold text-gray-600">Tap to upload your logo</span>
                                                <span className="text-[11px] text-gray-400">PNG or JPG, up to 5MB</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ── Categories ── */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-4 flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                                <LuLayoutGrid size={17} />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">What do you supply?</h2>
                                <p className="text-xs text-gray-400">Pick every category that fits</p>
                            </div>
                        </div>

                        {catLoading ? (
                            <div className="flex flex-wrap gap-2">
                                {[...Array(8)].map((_, i) => (
                                    <span key={i} className="h-10 w-28 animate-pulse rounded-full bg-gray-100" />
                                ))}
                            </div>
                        ) : catList.length === 0 ? (
                            <p className="rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-400">
                                No categories are set up yet. You can still apply — we will sort your
                                categories out during the review call.
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-wrap gap-2">
                                    {catList.map((c) => {
                                        const active = categories.includes(c._id);
                                        return (
                                            <button
                                                key={c._id}
                                                type="button"
                                                onClick={() => toggleCategory(c._id)}
                                                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-[13px] font-semibold transition-all ${
                                                    active
                                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm'
                                                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {active && <LuCheck size={13} />}
                                                {c.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="mt-3 text-xs text-gray-400">
                                    {categories.length > 0 ? `${categories.length} selected` : 'Nothing selected yet'}
                                </p>
                            </>
                        )}
                    </section>

                    {/* ── Contact ── */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                                <LuPhone size={17} />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">How we reach you</h2>
                                <p className="text-xs text-gray-400">We call this number to verify your application</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    className={inputCls}
                                    value={form.phone}
                                    onChange={(e) => set('phone', e.target.value)}
                                    placeholder="01XXXXXXXXX"
                                />
                                {errors.phone && <p className={errCls}>{errors.phone}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>WhatsApp</label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    className={inputCls}
                                    value={form.whatsapp}
                                    onChange={(e) => set('whatsapp', e.target.value)}
                                    placeholder="01XXXXXXXXX"
                                />
                                {errors.whatsapp && <p className={errCls}>{errors.whatsapp}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Email</label>
                                <div className="relative">
                                    <LuMail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input
                                        type="email"
                                        className={`${inputCls} pl-9`}
                                        value={form.email}
                                        onChange={(e) => set('email', e.target.value)}
                                        placeholder="office@company.com"
                                    />
                                </div>
                                {errors.email && <p className={errCls}>{errors.email}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Website</label>
                                <div className="relative">
                                    <LuGlobe size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input
                                        className={`${inputCls} pl-9`}
                                        value={form.website}
                                        onChange={(e) => set('website', e.target.value)}
                                        placeholder="https://"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Head office ── */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                                <LuMapPin size={17} />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">Head office</h2>
                                <p className="text-xs text-gray-400">You sell nationwide — this is just where your office sits</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Office address <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={2}
                                    className={`${inputCls} resize-y min-h-[72px]`}
                                    value={form.address}
                                    onChange={(e) => set('address', e.target.value)}
                                    placeholder="House / road / market, area"
                                />
                                {errors.address && <p className={errCls}>{errors.address}</p>}
                            </div>

                            <div>
                                <AreaSelect label="Head office area" value={area} onChange={setArea} />
                                <p className="mt-1.5 text-xs text-gray-400">
                                    Optional — a company sells nationwide, so this is only for our records.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ── Documents ── */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                                <LuFileText size={17} />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">Business documents</h2>
                                <p className="text-xs text-gray-400">Optional, but they speed up approval</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className={labelCls}>Trade licence no.</label>
                                <input className={inputCls} value={form.tradeLicense} onChange={(e) => set('tradeLicense', e.target.value)} placeholder="TRAD/..." />
                            </div>
                            <div>
                                <label className={labelCls}>TIN</label>
                                <input className={inputCls} value={form.tin} onChange={(e) => set('tin', e.target.value)} placeholder="12 digits" />
                            </div>
                            <div>
                                <label className={labelCls}>BIN</label>
                                <input className={inputCls} value={form.bin} onChange={(e) => set('bin', e.target.value)} placeholder="BIN number" />
                            </div>
                        </div>
                    </section>

                    {/* ── Submit ── */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <button
                            type="submit"
                            disabled={applying || uploading}
                            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                            {applying ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    Submitting…
                                </>
                            ) : (
                                <>Submit application <LuArrowRight size={16} /></>
                            )}
                        </button>
                        <p className="mt-3 text-xs leading-relaxed text-gray-400">
                            By applying you agree to our <Link href="/terms" className="font-semibold text-[var(--color-primary)] hover:underline">terms</Link> and
                            confirm the details above are correct.
                        </p>
                    </div>
                </form>

                {Sidebar}
            </div>
        </div>
    );
}
