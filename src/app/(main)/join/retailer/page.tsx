"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    LuStore,
    LuUser,
    LuPhone,
    LuMessageSquare,
    LuMapPin,
    LuIdCard,
    LuFileText,
    LuTag,
    LuChevronRight,
    LuClock,
    LuTriangleAlert,
    LuCircleAlert,
    LuLogIn,
    LuArrowRight,
    LuInfo,
    LuLoaderCircle,
    LuBadgeCheck,
    LuShieldCheck,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useApplyRetailerMutation, useGetMyRetailerQuery } from '@/redux/api/retailerApi';
import AreaSelect, { AreaValue } from '@/components/shared/AreaSelect';

/* ─── Constants ─── */
const SHOP_TYPES = [
    { value: 'grocery', label: 'Grocery Store' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'cosmetics', label: 'Cosmetics' },
    { value: 'stationery', label: 'Stationery' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'other', label: 'Other' },
];

const BENEFITS = [
    { icon: <LuTag size={16} />, title: 'Wholesale rates', text: 'Buy at dealer price and keep the retail margin.' },
    { icon: <LuStore size={16} />, title: 'Stock on credit', text: 'Approved shops get a credit limit for bulk orders.' },
    { icon: <LuMapPin size={16} />, title: 'Local dealer', text: 'Your upazila dealer delivers straight to the shop.' },
];

const inputCls =
    'w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 ' +
    'placeholder:text-gray-400 outline-none transition-colors ' +
    'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]';

const labelCls = 'block text-xs font-bold text-gray-500 mb-2';

const emptyForm = {
    shopName: '',
    ownerName: '',
    shopType: 'grocery',
    phone: '',
    whatsapp: '',
    address: '',
    nid: '',
    tradeLicense: '',
};

type FormState = typeof emptyForm;
type Errors = Partial<Record<keyof FormState | 'upazila', string>>;

/**
 * The shop record backing the status card. Everything is optional because the
 * same state also holds the optimistic stand-in written right after the POST,
 * before the populated `/me` copy lands.
 */
interface RetailerApplication {
    _id?: string;
    status?: string;
    shopName?: string;
    ownerName?: string;
    phone?: string;
    rejectionReason?: string;
    upazila?: string | { _id: string; name?: string } | null;
}

const BD_PHONE = /^01[3-9]\d{8}$/;

/** Accounts store phones as +8801…, 8801… or 01… — the form only takes the local form. */
const toLocalPhone = (raw?: string) => {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('880')) return '0' + digits.slice(3);
    if (digits.length === 10 && digits.startsWith('1')) return '0' + digits;
    return digits;
};

/* Statuses the API can hand back; each gets its own colour + copy. */
const STATUS_VIEW: Record<string, { icon: React.ReactNode; tone: string; title: string; text: string }> = {
    pending: {
        icon: <LuClock size={26} />,
        tone: 'amber',
        title: 'Application under review',
        text: 'Our team is verifying your shop details. This usually takes 1–2 working days.',
    },
    approved: {
        icon: <LuBadgeCheck size={26} />,
        tone: 'primary',
        title: 'Your shop is verified',
        text: 'Wholesale prices are unlocked. Head to your retailer panel to place bulk orders.',
    },
    rejected: {
        icon: <LuTriangleAlert size={26} />,
        tone: 'red',
        title: 'Application not approved',
        text: 'Your shop could not be verified with the details provided.',
    },
    suspended: {
        icon: <LuCircleAlert size={26} />,
        tone: 'red',
        title: 'Your shop is suspended',
        text: 'Wholesale ordering is paused for this shop. Contact us to restore access.',
    },
};

const TONE: Record<string, { ring: string; bg: string; fg: string }> = {
    amber: { ring: 'border-amber-200', bg: 'bg-amber-50', fg: 'text-amber-600' },
    red: { ring: 'border-red-200', bg: 'bg-red-50', fg: 'text-red-600' },
    primary: {
        ring: 'border-[rgba(var(--color-primary-rgb),0.25)]',
        bg: 'bg-[rgba(var(--color-primary-rgb),0.08)]',
        fg: 'text-[var(--color-primary)]',
    },
};

/**
 * Hero + page frame, shared by all four states. Kept at module scope on purpose:
 * declaring it inside the page would remount the form on every keystroke and
 * steal focus from the input being typed into.
 */
function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white min-h-screen">
            <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-[rgba(var(--color-primary-rgb),0.07)] to-white">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-[rgba(var(--color-primary-rgb),0.10)]"
                />
                <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 py-9 sm:py-12">
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                        <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
                        <LuChevronRight size={12} />
                        <span className="font-medium text-gray-600">Become a Retailer</span>
                    </nav>
                    <div className="flex items-start gap-4">
                        <div className="hidden sm:flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[rgba(var(--color-primary-rgb),0.35)]">
                            <LuStore size={26} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                Sell more from your shop
                            </h1>
                            <p className="mt-2 max-w-xl text-sm text-gray-500 leading-relaxed">
                                Register your shop with Mawa Homebazar BD and stock up at wholesale rates from your
                                local upazila dealer.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-10">{children}</div>
        </div>
    );
}

/* ─── Page ─── */
export default function JoinRetailerPage() {
    const { isAuthenticated, isRestoring, user } = useAppSelector((s) => s.auth);

    const {
        data: mine,
        isLoading: loadingMine,
        error: mineError,
        refetch,
    } = useGetMyRetailerQuery(undefined, { skip: !isAuthenticated });

    const [applyRetailer, { isLoading: submitting }] = useApplyRetailerMutation();

    const [form, setForm] = useState<FormState>(emptyForm);
    const [area, setArea] = useState<AreaValue>({});
    const [errors, setErrors] = useState<Errors>({});
    // Held locally so the status card shows the moment the POST returns: a query
    // sitting in its 404 state provides no tags, so invalidation cannot reach it.
    const [applied, setApplied] = useState<RetailerApplication | null>(null);

    // Most shopkeepers registered with the same number they run the shop on.
    useEffect(() => {
        if (user?.phone) setForm((f) => (f.phone ? f : { ...f, phone: toLocalPhone(user.phone) }));
    }, [user]);

    // Server copy wins once the refetch lands — it carries the populated upazila.
    const application = mine?.data || applied || null;
    // `/retailers/me` answers 404 until a shop applies — that is the empty state,
    // not a failure, so only other codes count as a real error.
    const httpStatus = (mineError as { status?: number } | undefined)?.status;
    const loadFailed = !!mineError && httpStatus !== 404 && httpStatus !== 401 && httpStatus !== 403;

    const set = (key: keyof FormState, value: string) => {
        setForm((f) => ({ ...f, [key]: value }));
        if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    };

    const handleArea = (next: AreaValue) => {
        setArea(next);
        if (next.upazila && errors.upazila) setErrors((e) => ({ ...e, upazila: undefined }));
    };

    const validate = (): Errors => {
        const e: Errors = {};
        if (!form.shopName.trim()) e.shopName = 'Shop name is required';
        if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
        if (!form.phone.trim()) e.phone = 'Phone number is required';
        else if (!BD_PHONE.test(form.phone.trim())) e.phone = 'Use an 11-digit number like 01712345678';
        if (form.whatsapp.trim() && !BD_PHONE.test(form.whatsapp.trim())) e.whatsapp = 'Use a number like 01712345678';
        if (!form.address.trim()) e.address = 'Shop address is required';
        if (!area.upazila) e.upazila = 'Select your division, district and upazila';
        return e;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const found = validate();
        if (Object.keys(found).length) {
            setErrors(found);
            toast.error('Please check the highlighted fields.');
            return;
        }
        try {
            const res = await applyRetailer({
                shopName: form.shopName.trim(),
                ownerName: form.ownerName.trim(),
                shopType: form.shopType,
                phone: form.phone.trim(),
                ...(form.whatsapp.trim() ? { whatsapp: form.whatsapp.trim() } : {}),
                address: form.address.trim(),
                upazila: area.upazila,
                ...(form.nid.trim() ? { nid: form.nid.trim() } : {}),
                ...(form.tradeLicense.trim() ? { tradeLicense: form.tradeLicense.trim() } : {}),
            }).unwrap();
            toast.success('Application submitted. We will verify your shop shortly.', { duration: 5000 });
            // The POST reply holds a raw upazila id; the name picked here is what
            // the status card needs until the refetch brings the populated copy.
            setApplied({
                status: 'pending',
                ...(res?.data || {}),
                shopName: form.shopName.trim(),
                ownerName: form.ownerName.trim(),
                phone: form.phone.trim(),
                upazila: { _id: area.upazila, name: area.upazilaName },
            });
            setErrors({});
            refetch();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            const e = err as { status?: number; data?: { message?: string } };
            const message = e?.data?.message || '';
            // The API rejects a second application; showing the existing one is
            // the useful answer, not an error toast.
            if (/already applied/i.test(message)) {
                toast('You have already applied — loading your application.');
                refetch();
                return;
            }
            toast.error(message || 'Could not submit your application. Please try again.');
        }
    };

    /* ─── State 1: session still resolving / profile loading ─── */
    if (isRestoring || (isAuthenticated && loadingMine)) {
        return (
            <Shell>
                <div className="animate-pulse space-y-4">
                    <div className="h-24 rounded-2xl bg-gray-100" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="h-14 rounded-xl bg-gray-100" />
                        <div className="h-14 rounded-xl bg-gray-100" />
                        <div className="h-14 rounded-xl bg-gray-100" />
                        <div className="h-14 rounded-xl bg-gray-100" />
                    </div>
                    <div className="h-28 rounded-xl bg-gray-100" />
                    <div className="h-12 w-44 rounded-xl bg-gray-100" />
                </div>
            </Shell>
        );
    }

    /* ─── State 2: not logged in ─── */
    if (!isAuthenticated) {
        return (
            <Shell>
                <div className="rounded-2xl border border-gray-100 bg-white p-8 sm:p-10 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--color-primary-rgb),0.10)] text-[var(--color-primary)]">
                        <LuLogIn size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Log in to apply</h2>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 leading-relaxed">
                        Your shop application is tied to your account, so you need to be logged in before you start.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                        <Link
                            href="/login?redirect=/join/retailer"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-md shadow-[rgba(var(--color-primary-rgb),0.3)] transition-colors hover:bg-[var(--color-primary-dark)]"
                        >
                            Log in <LuArrowRight size={15} />
                        </Link>
                        <Link
                            href="/register?redirect=/join/retailer"
                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gray-100 px-6 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
                        >
                            Create an account
                        </Link>
                    </div>
                </div>
                <BenefitStrip />
            </Shell>
        );
    }

    /* ─── State 3: profile could not be loaded ─── */
    if (loadFailed) {
        return (
            <Shell>
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                        <LuTriangleAlert size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">We could not load your application</h2>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                        Check your internet connection and try once more.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)]"
                    >
                        Try again
                    </button>
                </div>
            </Shell>
        );
    }

    /* ─── State 4: already applied ─── */
    if (application) {
        const view = STATUS_VIEW[application.status] || STATUS_VIEW.pending;
        const tone = TONE[view.tone];
        return (
            <Shell>
                <div className={`rounded-2xl border ${tone.ring} ${tone.bg} p-6 sm:p-8 shadow-sm`}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white ${tone.fg} shadow-sm`}>
                            {view.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold text-gray-900">{view.title}</h2>
                            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{view.text}</p>

                            {application.rejectionReason && (
                                <p className="mt-3 rounded-xl bg-white/70 px-4 py-3 text-sm text-gray-700">
                                    <span className="font-semibold">Reason: </span>
                                    {application.rejectionReason}
                                </p>
                            )}

                            <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <SummaryItem label="Shop" value={application.shopName} />
                                <SummaryItem label="Owner" value={application.ownerName} />
                                <SummaryItem label="Phone" value={application.phone} />
                                <SummaryItem
                                    label="Upazila"
                                    value={application.upazila?.name || '—'}
                                />
                            </dl>

                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                {application.status === 'approved' ? (
                                    <Link
                                        href="/dashboard/retailer"
                                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-md shadow-[rgba(var(--color-primary-rgb),0.3)] transition-colors hover:bg-[var(--color-primary-dark)]"
                                    >
                                        Go to retailer panel <LuArrowRight size={15} />
                                    </Link>
                                ) : (
                                    <Link
                                        href="/contact"
                                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-gray-700 border border-gray-200 transition-colors hover:bg-gray-50"
                                    >
                                        Contact support
                                    </Link>
                                )}
                                <Link
                                    href="/"
                                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white/70 px-6 text-sm font-semibold text-gray-600 transition-colors hover:bg-white"
                                >
                                    Back to shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {application.status !== 'approved' && <WholesaleNote />}
            </Shell>
        );
    }

    /* ─── State 5: the application form ─── */
    return (
        <Shell>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 sm:p-7 shadow-sm space-y-5"
                >
                    <div className="flex items-center gap-3 pb-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.10)] text-[var(--color-primary)]">
                            <LuStore size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Shop details</h2>
                            <p className="text-xs text-gray-400">
                                Applying as {user?.name || 'your account'}
                            </p>
                        </div>
                    </div>

                    <WholesaleNote compact />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Shop name" required error={errors.shopName} icon={<LuStore size={13} />}>
                            <input
                                type="text"
                                value={form.shopName}
                                onChange={(e) => set('shopName', e.target.value)}
                                placeholder="Bismillah Store"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Owner name" required error={errors.ownerName} icon={<LuUser size={13} />}>
                            <input
                                type="text"
                                value={form.ownerName}
                                onChange={(e) => set('ownerName', e.target.value)}
                                placeholder="Full name as on NID"
                                className={inputCls}
                            />
                        </Field>
                    </div>

                    <Field label="Shop type" icon={<LuTag size={13} />}>
                        <select
                            value={form.shopType}
                            onChange={(e) => set('shopType', e.target.value)}
                            className={`${inputCls} cursor-pointer`}
                        >
                            {SHOP_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Phone" required error={errors.phone} icon={<LuPhone size={13} />}>
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={form.phone}
                                onChange={(e) => set('phone', e.target.value)}
                                placeholder="01XXXXXXXXX"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="WhatsApp" error={errors.whatsapp} icon={<LuMessageSquare size={13} />}>
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={form.whatsapp}
                                onChange={(e) => set('whatsapp', e.target.value)}
                                placeholder="Same as phone if empty"
                                className={inputCls}
                            />
                        </Field>
                    </div>

                    <Field label="Shop address" required error={errors.address} icon={<LuMapPin size={13} />}>
                        <textarea
                            value={form.address}
                            onChange={(e) => set('address', e.target.value)}
                            placeholder="Market name, road, landmark..."
                            rows={3}
                            className={`${inputCls} resize-none`}
                        />
                    </Field>

                    <div>
                        <AreaSelect
                            label="Shop location"
                            required
                            value={area}
                            onChange={handleArea}
                        />
                        {errors.upazila ? (
                            <p className="mt-1.5 text-xs font-medium text-red-500">{errors.upazila}</p>
                        ) : (
                            <p className="mt-1.5 text-xs text-gray-400">
                                Your shop is served by the dealer of this upazila.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <Field label="NID number" icon={<LuIdCard size={13} />}>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.nid}
                                onChange={(e) => set('nid', e.target.value)}
                                placeholder="Optional"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Trade licence no." icon={<LuFileText size={13} />}>
                            <input
                                type="text"
                                value={form.tradeLicense}
                                onChange={(e) => set('tradeLicense', e.target.value)}
                                placeholder="Optional"
                                className={inputCls}
                            />
                        </Field>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">
                        Adding your NID and trade licence speeds up verification, but you can submit without them.
                    </p>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 text-sm font-bold text-white shadow-md shadow-[rgba(var(--color-primary-rgb),0.3)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
                    >
                        {submitting ? (
                            <>
                                <LuLoaderCircle size={16} className="animate-spin" /> Submitting...
                            </>
                        ) : (
                            <>
                                Submit application <LuArrowRight size={15} />
                            </>
                        )}
                    </button>
                </form>

                {/* Side rail */}
                <aside className="space-y-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Why register your shop</h3>
                        <ul className="space-y-3.5">
                            {BENEFITS.map((b) => (
                                <li key={b.title} className="flex gap-3">
                                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--color-primary-rgb),0.10)] text-[var(--color-primary)]">
                                        {b.icon}
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold text-gray-800">{b.title}</span>
                                        <span className="block text-xs text-gray-500 leading-relaxed">{b.text}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <LuShieldCheck size={15} className="text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-700">What happens next</h3>
                        </div>
                        <ol className="space-y-2 text-xs text-gray-500 leading-relaxed">
                            <li>1. We check your shop details and location.</li>
                            <li>2. Your upazila dealer may call or visit the shop.</li>
                            <li>3. Once verified, wholesale pricing turns on.</li>
                        </ol>
                    </div>
                </aside>
            </div>
        </Shell>
    );
}

/* ─── Small pieces ─── */
function Field({
    label,
    required,
    error,
    icon,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className={labelCls}>
                <span className="inline-flex items-center gap-1.5">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    {label} {required && <span className="text-red-500">*</span>}
                </span>
            </label>
            {children}
            {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}

function SummaryItem({ label, value }: { label: string; value?: string }) {
    return (
        <div className="rounded-xl bg-white/70 px-4 py-3">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-gray-800 break-words">{value || '—'}</dd>
        </div>
    );
}

function WholesaleNote({ compact = false }: { compact?: boolean }) {
    return (
        <div
            className={`flex gap-3 rounded-xl border border-[rgba(var(--color-primary-rgb),0.25)] bg-[rgba(var(--color-primary-rgb),0.06)] p-4 ${compact ? '' : 'mt-5'}`}
        >
            <LuInfo size={17} className="mt-0.5 flex-shrink-0 text-[var(--color-primary)]" />
            <p className="text-xs sm:text-[13px] text-gray-700 leading-relaxed">
                <span className="font-bold text-[var(--color-primary)]">Wholesale prices are visible once your shop is verified.</span>{' '}
                Until then you can browse the store at regular retail prices.
            </p>
        </div>
    );
}

function BenefitStrip() {
    return (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BENEFITS.map((b) => (
                <div key={b.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.10)] text-[var(--color-primary)]">
                        {b.icon}
                    </span>
                    <p className="text-sm font-bold text-gray-800">{b.title}</p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{b.text}</p>
                </div>
            ))}
        </div>
    );
}
