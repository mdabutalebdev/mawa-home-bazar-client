"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    LuChevronRight,
    LuStore,
    LuTruck,
    LuHandshake,
    LuWallet,
    LuShieldCheck,
    LuInfo,
    LuLogIn,
    LuIdCard,
    LuPhone,
    LuMapPin,
    LuSend,
    LuLoaderCircle,
    LuHourglass,
    LuBadgeCheck,
    LuCircleX,
    LuBan,
    LuTriangleAlert,
    LuLayoutDashboard,
    LuArrowRight,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { useApplyDealerMutation, useGetMyDealerQuery } from '@/redux/api/dealerApi';
import AreaSelect, { AreaValue } from '@/components/shared/AreaSelect';

const BD_PHONE = /^01[3-9]\d{8}$/;

const inputCls =
    'w-full min-h-[46px] px-4 py-3 rounded-xl border bg-white text-sm text-gray-800 outline-none transition-colors ' +
    'placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]';

const labelCls = 'block text-xs font-bold text-gray-500 mb-2';

interface FormState {
    name: string;
    phone: string;
    whatsapp: string;
    address: string;
    nid: string;
    homeDelivery: boolean;
}

type FieldErrors = Partial<Record<keyof FormState | 'upazila', string>>;

/** Populated area ref as it comes back from /dealers/me. */
interface AreaRef {
    _id?: string;
    name?: string;
}

/**
 * The dealer record shown on the status card. Every field is optional because
 * the same state also holds the optimistic `{ status: 'pending', ...form }`
 * stand-in written straight after the POST, before the server copy arrives.
 */
interface DealerApplication {
    _id?: string;
    name?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    nid?: string;
    homeDelivery?: boolean;
    status?: 'pending' | 'approved' | 'rejected' | 'suspended';
    rejectionReason?: string;
    upazila?: AreaRef | string | null;
}

/** Shape of an RTK Query error once the server has actually answered. */
interface ApiError {
    status?: number;
    data?: { message?: string };
}

const emptyForm: FormState = {
    name: '',
    phone: '',
    whatsapp: '',
    address: '',
    nid: '',
    homeDelivery: false,
};

const PERKS = [
    { icon: <LuMapPin size={18} />, title: 'Your own upazila', text: 'Every order placed in your area comes to you first — no one else sells it.' },
    { icon: <LuWallet size={18} />, title: 'Commission per order', text: 'You earn on every confirmed order from your territory, paid to your wallet.' },
    { icon: <LuTruck size={18} />, title: 'Deliver or hand off', text: 'Run your own riders for local delivery, or let our courier partner carry it.' },
];

/** Phone numbers arrive as +8801…, 8801… or 01… — the form only accepts the local form. */
const toLocalPhone = (raw?: string) => {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('880')) return '0' + digits.slice(3);
    if (digits.length === 10 && digits.startsWith('1')) return '0' + digits;
    return digits;
};

/* Module scope on purpose — a shell declared inside the page component would be a
   new component type on every render and remount the form, stealing input focus. */
const Page = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-100 bg-gradient-to-b from-[rgba(var(--color-primary-rgb),0.06)] to-white">
            <div className="container py-8 sm:py-12">
                <div className="mx-auto max-w-4xl">
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                        <Link href="/" className="hover:text-[var(--color-primary)]">Home</Link>
                        <LuChevronRight size={12} />
                        <span className="font-medium text-gray-600">Become a Dealer</span>
                    </nav>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-primary-rgb),0.1)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                        <LuHandshake size={13} /> Dealer Programme
                    </span>

                    <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold leading-tight text-gray-900">
                        Run Mawa Homebazar in your upazila
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm sm:text-[15px] leading-relaxed text-gray-500">
                        One dealer per upazila. You confirm the orders from your area, earn commission on
                        each one, and decide whether your own riders deliver them.
                    </p>
                </div>
            </div>
        </div>

        <div className="container py-6 sm:py-10">
            <div className="mx-auto max-w-4xl">{children}</div>
        </div>
    </div>
);

export default function JoinDealerPage() {
    const { isAuthenticated, user, isRestoring } = useAppSelector((s) => s.auth);

    const {
        data: myRes,
        isLoading: checking,
        error: checkError,
        refetch,
    } = useGetMyDealerQuery(undefined, { skip: !isAuthenticated });

    const [applyDealer, { isLoading: submitting }] = useApplyDealerMutation();

    const [form, setForm] = useState<FormState>(emptyForm);
    const [area, setArea] = useState<AreaValue>({});
    const [errors, setErrors] = useState<FieldErrors>({});
    // Held locally so the status card appears the instant the POST returns —
    // the /dealers/me query was in its 404 state and will not self-refetch.
    const [applied, setApplied] = useState<DealerApplication | null>(null);

    useEffect(() => {
        if (user?.phone) setForm((f) => (f.phone ? f : { ...f, phone: toLocalPhone(user.phone) }));
    }, [user]);

    // Transport failures (FETCH_ERROR/TIMEOUT_ERROR) carry a string status, so only
    // a numeric one counts as an HTTP code worth interpreting below.
    const status: number | undefined =
        checkError && 'status' in checkError && typeof checkError.status === 'number'
            ? checkError.status
            : undefined;
    // 404 simply means "no application yet" — that is the form path, not an error.
    const loadFailed = !!checkError && status !== 404 && status !== 401 && status !== 403;
    const dealer: DealerApplication | null = applied || myRes?.data || null;

    const set = (patch: Partial<FormState>, clear?: keyof FieldErrors) => {
        setForm((f) => ({ ...f, ...patch }));
        if (clear && errors[clear]) setErrors((e) => ({ ...e, [clear]: undefined }));
    };

    const handleArea = (next: AreaValue) => {
        setArea(next);
        if (next.upazila && errors.upazila) setErrors((e) => ({ ...e, upazila: undefined }));
    };

    const validate = (): FieldErrors => {
        const e: FieldErrors = {};
        if (!form.name.trim()) e.name = 'Business or dealer name is required';
        if (!form.phone.trim()) e.phone = 'Phone number is required';
        else if (!BD_PHONE.test(form.phone.trim())) e.phone = 'Enter an 11-digit number starting with 01 — like 01712345678';
        if (form.whatsapp.trim() && !BD_PHONE.test(form.whatsapp.trim()))
            e.whatsapp = 'Enter an 11-digit number starting with 01, or leave it empty';
        if (!form.address.trim()) e.address = 'Your full address is required';
        if (!area.upazila) e.upazila = 'Select your division, district and upazila';
        return e;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const found = validate();
        if (Object.keys(found).length) {
            setErrors(found);
            toast.error('Please fix the highlighted fields');
            return;
        }

        try {
            const res = await applyDealer({
                name: form.name.trim(),
                phone: form.phone.trim(),
                whatsapp: form.whatsapp.trim() || undefined,
                address: form.address.trim(),
                division: area.division,
                district: area.district,
                upazila: area.upazila,
                nid: form.nid.trim() || undefined,
                homeDelivery: form.homeDelivery,
            }).unwrap();

            toast.success('Application received. We will call you soon.', { duration: 5000 });
            setApplied(res?.data || { status: 'pending', ...form });
            setErrors({});
            refetch();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            const e = err as ApiError;
            const msg: string = e?.data?.message || '';
            if (e?.status === 409 && /upazila/i.test(msg)) {
                toast.error(
                    'This upazila already has an approved dealer. Pick a nearby upazila, or call us — we open new areas often.',
                    { duration: 7000 }
                );
                setErrors({ upazila: 'This area already has an approved dealer' });
                return;
            }
            if (e?.status === 409) {
                toast('You have already applied — loading your application status.');
                refetch();
                return;
            }
            toast.error(msg || 'Could not send your application. Please try again.');
        }
    };

    /* ─── Loading ─── */

    if (isRestoring || (isAuthenticated && checking)) {
        return (
            <Page>
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="animate-pulse space-y-4">
                        <div className="h-5 w-48 rounded bg-gray-200" />
                        <div className="h-11 rounded-xl bg-gray-100" />
                        <div className="h-11 rounded-xl bg-gray-100" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="h-11 rounded-xl bg-gray-100" />
                            <div className="h-11 rounded-xl bg-gray-100" />
                            <div className="h-11 rounded-xl bg-gray-100" />
                        </div>
                        <div className="h-24 rounded-xl bg-gray-100" />
                    </div>
                    <p className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <LuLoaderCircle size={13} className="animate-spin" /> Checking your application…
                    </p>
                </div>
            </Page>
        );
    }

    /* ─── Not logged in ─── */

    if (!isAuthenticated) {
        return (
            <Page>
                <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                        <LuLogIn size={26} />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-gray-900">Please log in to apply</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                        Your dealer application is tied to your account, so we can call you back and open
                        your dashboard the moment it is approved.
                    </p>
                    <Link
                        href="/login?redirect=/join/dealer"
                        className="mt-6 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-7 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-dark)]"
                    >
                        Log in to continue <LuArrowRight size={15} />
                    </Link>
                    <p className="mt-4 text-xs text-gray-400">
                        New here?{' '}
                        <Link href="/register" className="font-semibold text-[var(--color-primary)] hover:underline">
                            Create a free account
                        </Link>
                    </p>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PERKS.map((p) => (
                        <div key={p.title} className="rounded-2xl border border-gray-100 bg-white p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                                {p.icon}
                            </div>
                            <p className="mt-2.5 text-sm font-bold text-gray-800">{p.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-gray-500">{p.text}</p>
                        </div>
                    ))}
                </div>
            </Page>
        );
    }

    /* ─── Could not read the existing application ─── */

    if (loadFailed) {
        return (
            <Page>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <LuTriangleAlert size={28} className="mx-auto text-amber-500" />
                    <h2 className="mt-3 text-base font-bold text-amber-900">We could not check your application</h2>
                    <p className="mt-1.5 text-sm text-amber-700">
                        The connection dropped. Please try again in a moment.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="mt-4 min-h-[44px] rounded-xl bg-amber-500 px-6 text-sm font-bold text-white transition-colors hover:bg-amber-600"
                    >
                        Try again
                    </button>
                </div>
            </Page>
        );
    }

    /* ─── Existing application → status card ─── */

    if (dealer) {
        const upazilaName =
            (typeof dealer.upazila === 'object' && dealer.upazila?.name) || area.upazilaName || '';
        const reason: string = dealer.rejectionReason || '';

        const meta = {
            pending: {
                icon: <LuHourglass size={26} />,
                tone: 'text-amber-600 bg-amber-50 border-amber-200',
                pill: 'bg-amber-100 text-amber-700',
                pillText: 'Under review',
                title: 'Under review — we will call you',
                body: 'Our team is verifying your details. Because only one dealer is approved per upazila, we call every applicant before deciding. Expect a call on the number you gave us within 2–3 working days.',
            },
            approved: {
                icon: <LuBadgeCheck size={26} />,
                tone: 'text-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.08)] border-[rgba(var(--color-primary-rgb),0.25)]',
                pill: 'bg-[rgba(var(--color-primary-rgb),0.12)] text-[var(--color-primary)]',
                pillText: 'Approved',
                title: 'You are live — go to your dashboard',
                body: 'You are the approved dealer for your upazila. New orders from your area now appear in your dashboard for you to confirm.',
            },
            rejected: {
                icon: <LuCircleX size={26} />,
                tone: 'text-red-600 bg-red-50 border-red-200',
                pill: 'bg-red-100 text-red-700',
                pillText: 'Not approved',
                title: 'Your application was not approved',
                body: 'This does not close the door. Areas open up as we grow — talk to us and we will tell you what is available near you.',
            },
            suspended: {
                icon: <LuBan size={26} />,
                tone: 'text-gray-600 bg-gray-100 border-gray-200',
                pill: 'bg-gray-200 text-gray-700',
                pillText: 'Suspended',
                title: 'Your dealer account is on hold',
                body: 'Orders from your area are not being routed to you right now. Our team can walk you through what is needed to resume.',
            },
        } as const;

        const view = meta[(dealer.status as keyof typeof meta) || 'pending'] || meta.pending;

        return (
            <Page>
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 border-b p-5 sm:p-6 ${view.tone}`}>
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/70">
                            {view.icon}
                        </div>
                        <div className="min-w-0">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${view.pill}`}>
                                {view.pillText}
                            </span>
                            <h2 className="mt-1.5 text-lg font-extrabold leading-snug text-gray-900">{view.title}</h2>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        <p className="text-sm leading-relaxed text-gray-600">{view.body}</p>

                        {reason && (dealer.status === 'rejected' || dealer.status === 'suspended') && (
                            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                    {dealer.status === 'rejected' ? 'Reason given' : 'Note from our team'}
                                </p>
                                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-700">{reason}</p>
                            </div>
                        )}

                        <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { label: 'Dealer name', value: dealer.name },
                                { label: 'Phone', value: dealer.phone },
                                { label: 'Upazila', value: upazilaName },
                                { label: 'Home delivery', value: dealer.homeDelivery ? 'Yes, own riders' : 'Courier partner' },
                            ]
                                .filter((row) => !!row.value)
                                .map((row) => (
                                    <div key={row.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                        <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{row.label}</dt>
                                        <dd className="mt-0.5 text-sm font-semibold text-gray-800">{row.value}</dd>
                                    </div>
                                ))}
                        </dl>

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            {dealer.status === 'approved' ? (
                                <Link
                                    href="/dashboard/dealer"
                                    className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-dark)]"
                                >
                                    <LuLayoutDashboard size={16} /> Go to my dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/contact"
                                    className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-dark)]"
                                >
                                    <LuPhone size={15} /> Talk to our team
                                </Link>
                            )}
                            <Link
                                href="/"
                                className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                            >
                                Back to shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </Page>
        );
    }

    /* ─── The form ─── */

    return (
        <Page>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Form */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                            <LuStore size={19} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Dealer application</h2>
                            <p className="text-xs text-gray-400">Takes about two minutes</p>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2.5 rounded-xl border border-[rgba(var(--color-primary-rgb),0.25)] bg-[rgba(var(--color-primary-rgb),0.06)] p-3.5">
                        <LuInfo size={16} className="mt-0.5 flex-shrink-0 text-[var(--color-primary)]" />
                        <p className="text-xs leading-relaxed text-gray-600">
                            One dealer is approved per upazila. If your area is already taken we will contact
                            you about nearby openings.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                        <div>
                            <label className={labelCls}>
                                Business / dealer name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => set({ name: e.target.value }, 'name')}
                                placeholder="e.g. Rahman Traders"
                                className={`${inputCls} ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                            />
                            {errors.name && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={11}
                                    value={form.phone}
                                    onChange={(e) => set({ phone: e.target.value.replace(/\D/g, '') }, 'phone')}
                                    placeholder="01712345678"
                                    className={`${inputCls} ${errors.phone ? 'border-red-300' : 'border-gray-200'}`}
                                />
                                {errors.phone
                                    ? <p className="mt-1.5 text-xs font-medium text-red-500">{errors.phone}</p>
                                    : <p className="mt-1.5 text-xs text-gray-400">We call this number to verify your application.</p>}
                            </div>
                            <div>
                                <label className={labelCls}>WhatsApp <span className="font-medium text-gray-400">(optional)</span></label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={11}
                                    value={form.whatsapp}
                                    onChange={(e) => set({ whatsapp: e.target.value.replace(/\D/g, '') }, 'whatsapp')}
                                    placeholder="01712345678"
                                    className={`${inputCls} ${errors.whatsapp ? 'border-red-300' : 'border-gray-200'}`}
                                />
                                {errors.whatsapp && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.whatsapp}</p>}
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>
                                Full address <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={form.address}
                                onChange={(e) => set({ address: e.target.value }, 'address')}
                                rows={3}
                                placeholder="Shop / house, road, market or village name"
                                className={`${inputCls} resize-none ${errors.address ? 'border-red-300' : 'border-gray-200'}`}
                            />
                            {errors.address && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.address}</p>}
                        </div>

                        <div>
                            <AreaSelect
                                label="Your area"
                                required
                                value={area}
                                onChange={handleArea}
                            />
                            {errors.upazila && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.upazila}</p>}
                        </div>

                        <div>
                            <label className={labelCls}>
                                National ID number <span className="font-medium text-gray-400">(optional)</span>
                            </label>
                            <div className="relative">
                                <LuIdCard size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={form.nid}
                                    onChange={(e) => set({ nid: e.target.value })}
                                    placeholder="1234567890"
                                    className={`${inputCls} border-gray-200 pl-10`}
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-gray-400">
                                Speeds up verification. Never shown to customers.
                            </p>
                        </div>

                        <label className="flex min-h-[52px] cursor-pointer select-none items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5 transition-colors hover:bg-gray-100">
                            <input
                                type="checkbox"
                                checked={form.homeDelivery}
                                onChange={(e) => set({ homeDelivery: e.target.checked })}
                                className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-gray-300 accent-[var(--color-primary)]"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-gray-800">
                                    I can deliver inside my upazila with my own riders
                                </span>
                                <span className="mt-0.5 block text-xs text-gray-500">
                                    Turn this on only if you have riders. You can change it later.
                                </span>
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting
                                ? <><LuLoaderCircle size={16} className="animate-spin" /> Sending…</>
                                : <><LuSend size={15} /> Submit application</>}
                        </button>

                        <p className="text-center text-xs leading-relaxed text-gray-400">
                            By applying you agree to our{' '}
                            <Link href="/terms" className="font-semibold text-[var(--color-primary)] hover:underline">terms</Link>.
                            We never share your documents.
                        </p>
                    </form>
                </div>

                {/* Side */}
                <aside className="space-y-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <p className="text-sm font-bold text-gray-900">Why become a dealer</p>
                        <div className="mt-3 space-y-3.5">
                            {PERKS.map((p) => (
                                <div key={p.title} className="flex gap-3">
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]">
                                        {p.icon}
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-gray-800">{p.title}</p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{p.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            <LuShieldCheck size={16} className="text-[var(--color-primary)]" /> What happens next
                        </p>
                        <ol className="mt-3 space-y-3">
                            {[
                                'You submit this form.',
                                'Our team calls you to verify your shop and area.',
                                'Once approved, your dealer dashboard opens.',
                            ].map((step, i) => (
                                <li key={i} className="flex gap-3">
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(var(--color-primary-rgb),0.1)] text-[11px] font-bold text-[var(--color-primary)]">
                                        {i + 1}
                                    </span>
                                    <span className="text-xs leading-relaxed text-gray-600">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <p className="text-sm font-bold text-gray-900">Questions before applying?</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                            Ask us about commission, coverage or delivery — we are happy to explain.
                        </p>
                        <Link
                            href="/contact"
                            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            <LuPhone size={14} /> Contact us
                        </Link>
                    </div>
                </aside>
            </div>
        </Page>
    );
}
