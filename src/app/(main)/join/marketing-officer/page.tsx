"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    LuBriefcase,
    LuPhone,
    LuIdCard,
    LuBadgeCheck,
    LuMapPinned,
    LuNavigation,
    LuPlus,
    LuX,
    LuChevronRight,
    LuClock,
    LuTriangleAlert,
    LuCircleAlert,
    LuLogIn,
    LuArrowRight,
    LuInfo,
    LuLoaderCircle,
    LuUserCheck,
    LuShieldCheck,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import {
    useApplyMarketingOfficerMutation,
    useGetMyMarketingOfficerQuery,
} from '@/redux/api/marketingApi';
import AreaSelect, { AreaValue } from '@/components/shared/AreaSelect';

/* ─── Constants ─── */
const DUTIES = [
    { icon: <LuNavigation size={16} />, title: 'Daily check-in', text: 'Start your day by sharing your location from the app.' },
    { icon: <LuMapPinned size={16} />, title: 'Field visits', text: 'Meet dealers and shops in the upazilas you cover.' },
    { icon: <LuUserCheck size={16} />, title: 'Sign up partners', text: 'Bring new dealers and retailers onto the platform.' },
];

const inputCls =
    'w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 ' +
    'placeholder:text-gray-400 outline-none transition-colors ' +
    'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]';

const labelCls = 'block text-xs font-bold text-gray-500 mb-2';

const emptyForm = { phone: '', nid: '', employeeId: '' };

type FormState = typeof emptyForm;
type Errors = Partial<Record<keyof FormState | 'assignedUpazilas', string>>;

/**
 * The officer record backing the status card. Everything is optional because the
 * same state also holds the optimistic stand-in written right after the POST,
 * before the populated `/me` copy lands.
 */
interface OfficerApplication {
    _id?: string;
    status?: string;
    phone?: string;
    employeeId?: string;
    rejectionReason?: string;
    assignedUpazilas?: (string | { _id: string; name?: string })[];
}

/** An upazila the applicant wants to cover — the name is kept only for the chip. */
interface PickedArea {
    id: string;
    name: string;
}

const BD_PHONE = /^01[3-9]\d{8}$/;

/** Accounts store phones as +8801…, 8801… or 01… — the form only takes the local form. */
const toLocalPhone = (raw?: string) => {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('880')) return '0' + digits.slice(3);
    if (digits.length === 10 && digits.startsWith('1')) return '0' + digits;
    return digits;
};

const STATUS_VIEW: Record<string, { icon: React.ReactNode; tone: string; title: string; text: string }> = {
    pending: {
        icon: <LuClock size={26} />,
        tone: 'amber',
        title: 'Application under review',
        text: 'The team is reviewing your details. You will get a call once a decision is made.',
    },
    approved: {
        icon: <LuBadgeCheck size={26} />,
        tone: 'primary',
        title: 'You are on the field team',
        text: 'Open your panel to check in for the day and start filing visit reports.',
    },
    rejected: {
        icon: <LuTriangleAlert size={26} />,
        tone: 'red',
        title: 'Application not approved',
        text: 'There is no open field position matching your application right now.',
    },
    suspended: {
        icon: <LuCircleAlert size={26} />,
        tone: 'red',
        title: 'Your account is suspended',
        text: 'Reporting is paused for your account. Contact the office to restore access.',
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
                        <span className="font-medium text-gray-600">Marketing Officer</span>
                    </nav>
                    <div className="flex items-start gap-4">
                        <div className="hidden sm:flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[rgba(var(--color-primary-rgb),0.35)]">
                            <LuBriefcase size={26} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                Join the field team
                            </h1>
                            <p className="mt-2 max-w-xl text-sm text-gray-500 leading-relaxed">
                                Marketing officers work on the ground — visiting dealers and shops, signing up new
                                partners and reporting from the field every day.
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
export default function JoinMarketingOfficerPage() {
    const { isAuthenticated, isRestoring, user } = useAppSelector((s) => s.auth);

    const {
        data: mine,
        isLoading: loadingMine,
        error: mineError,
        refetch,
    } = useGetMyMarketingOfficerQuery(undefined, { skip: !isAuthenticated });

    const [applyOfficer, { isLoading: submitting }] = useApplyMarketingOfficerMutation();

    const [form, setForm] = useState<FormState>(emptyForm);
    const [area, setArea] = useState<AreaValue>({});
    const [picked, setPicked] = useState<PickedArea[]>([]);
    const [errors, setErrors] = useState<Errors>({});
    // Held locally so the status card shows the moment the POST returns: a query
    // sitting in its 404 state provides no tags, so invalidation cannot reach it.
    const [applied, setApplied] = useState<OfficerApplication | null>(null);

    useEffect(() => {
        if (user?.phone) setForm((f) => (f.phone ? f : { ...f, phone: toLocalPhone(user.phone) }));
    }, [user]);

    // Server copy wins once the refetch lands — it carries the populated upazilas.
    const application = mine?.data || applied || null;
    // `/marketing-officers/me` answers 404 until someone applies — that is the
    // empty state, not a failure, so only other codes count as a real error.
    const httpStatus = (mineError as { status?: number } | undefined)?.status;
    const loadFailed = !!mineError && httpStatus !== 404 && httpStatus !== 401 && httpStatus !== 403;

    const set = (key: keyof FormState, value: string) => {
        setForm((f) => ({ ...f, [key]: value }));
        if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    };

    const addArea = () => {
        if (!area.upazila) {
            toast.error('Pick a division, district and upazila first.');
            return;
        }
        if (picked.some((p) => p.id === area.upazila)) {
            toast.error('That upazila is already on your list.');
            return;
        }
        setPicked((list) => [...list, { id: area.upazila as string, name: area.upazilaName || 'Selected upazila' }]);
        // Keep division/district so adding neighbouring upazilas stays a one-tap job.
        setArea((a) => ({ ...a, upazila: undefined, upazilaName: undefined }));
        setErrors((e) => ({ ...e, assignedUpazilas: undefined }));
    };

    const removeArea = (id: string) => setPicked((list) => list.filter((p) => p.id !== id));

    const validate = (): Errors => {
        const e: Errors = {};
        if (!form.phone.trim()) e.phone = 'Phone number is required';
        else if (!BD_PHONE.test(form.phone.trim())) e.phone = 'Use an 11-digit number like 01712345678';
        if (picked.length === 0) e.assignedUpazilas = 'Add at least one upazila you can cover';
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
            const res = await applyOfficer({
                phone: form.phone.trim(),
                assignedUpazilas: picked.map((p) => p.id),
                ...(form.nid.trim() ? { nid: form.nid.trim() } : {}),
                ...(form.employeeId.trim() ? { employeeId: form.employeeId.trim() } : {}),
            }).unwrap();
            toast.success('Application submitted. The office will contact you soon.', { duration: 5000 });
            // The create response returns upazila ids only; the names picked here
            // are what the chips need, so they are kept for the status card.
            setApplied({
                status: 'pending',
                phone: form.phone.trim(),
                ...(res?.data || {}),
                assignedUpazilas: picked.map((p) => ({ _id: p.id, name: p.name })),
            });
            setErrors({});
            refetch();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            const e = err as { status?: number; data?: { message?: string } };
            const message = e?.data?.message || '';
            // A second application is refused; showing the existing one is the
            // useful answer, not an error toast.
            if (e?.status === 409 || /already applied/i.test(message)) {
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
                        Field reports and daily check-in run off your account, so you need to be logged in before you
                        apply.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                        <Link
                            href="/login?redirect=/join/marketing-officer"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-md shadow-[rgba(var(--color-primary-rgb),0.3)] transition-colors hover:bg-[var(--color-primary-dark)]"
                        >
                            Log in <LuArrowRight size={15} />
                        </Link>
                        <Link
                            href="/register?redirect=/join/marketing-officer"
                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gray-100 px-6 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
                        >
                            Create an account
                        </Link>
                    </div>
                </div>
                <DutyStrip />
                <CheckInNote />
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
        // Populated by `/me`, but a bare id array when it came from the POST reply.
        const areas: { _id: string; name?: string }[] = (application.assignedUpazilas || []).map(
            (a: string | { _id: string; name?: string }) => (typeof a === 'string' ? { _id: a } : a)
        );
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
                                <SummaryItem label="Phone" value={application.phone} />
                                <SummaryItem label="Employee ID" value={application.employeeId} />
                            </dl>

                            <div className="mt-4 rounded-xl bg-white/70 px-4 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                    Assigned upazilas
                                </p>
                                {areas.length === 0 ? (
                                    <p className="mt-1.5 text-sm text-gray-500">
                                        Not assigned yet — the office confirms your territory on approval.
                                    </p>
                                ) : (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {areas.map((a) => (
                                            <span
                                                key={a._id}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700"
                                            >
                                                <LuMapPinned size={12} className="text-gray-400" />
                                                {a.name || 'Upazila'}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                {application.status === 'approved' ? (
                                    <Link
                                        href="/dashboard/marketing"
                                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-md shadow-[rgba(var(--color-primary-rgb),0.3)] transition-colors hover:bg-[var(--color-primary-dark)]"
                                    >
                                        Go to officer panel <LuArrowRight size={15} />
                                    </Link>
                                ) : (
                                    <Link
                                        href="/contact"
                                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-gray-700 border border-gray-200 transition-colors hover:bg-gray-50"
                                    >
                                        Contact the office
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

                <CheckInNote />
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
                            <LuBriefcase size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Your details</h2>
                            <p className="text-xs text-gray-400">
                                Applying as {user?.name || 'your account'}
                            </p>
                        </div>
                    </div>

                    <CheckInNote compact />

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
                    </div>

                    <Field label="Employee ID" icon={<LuBadgeCheck size={13} />}>
                        <input
                            type="text"
                            value={form.employeeId}
                            onChange={(e) => set('employeeId', e.target.value)}
                            placeholder="Only if you already have one"
                            className={inputCls}
                        />
                        <p className="mt-1.5 text-xs text-gray-400">
                            Leave this blank if you are new — the office issues an ID on approval.
                        </p>
                    </Field>

                    {/* Multi-area picker */}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <LuMapPinned size={15} className="text-[var(--color-primary)]" />
                            <h3 className="text-sm font-bold text-gray-800">
                                Areas you can cover <span className="text-red-500">*</span>
                            </h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            Pick an upazila and press Add. Add as many as you can travel to — the office confirms your
                            final territory on approval.
                        </p>

                        <AreaSelect value={area} onChange={setArea} />

                        <button
                            type="button"
                            onClick={addArea}
                            className="mt-3 inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[rgba(var(--color-primary-rgb),0.3)] bg-white px-5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[rgba(var(--color-primary-rgb),0.06)]"
                        >
                            <LuPlus size={15} /> Add upazila
                        </button>

                        <div className="mt-4">
                            {picked.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-5 text-center text-xs text-gray-400">
                                    No upazila added yet.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {picked.map((p) => (
                                        <span
                                            key={p.id}
                                            className="inline-flex items-center gap-1 rounded-xl bg-[rgba(var(--color-primary-rgb),0.10)] py-1 pl-3 pr-1 text-xs font-semibold text-[var(--color-primary)]"
                                        >
                                            {p.name}
                                            <button
                                                type="button"
                                                onClick={() => removeArea(p.id)}
                                                aria-label={`Remove ${p.name}`}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-primary)] transition-colors hover:bg-white"
                                            >
                                                <LuX size={13} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {errors.assignedUpazilas && (
                                <p className="mt-2 text-xs font-medium text-red-500">{errors.assignedUpazilas}</p>
                            )}
                        </div>
                    </div>

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
                        <h3 className="text-sm font-bold text-gray-900 mb-3">What the job involves</h3>
                        <ul className="space-y-3.5">
                            {DUTIES.map((d) => (
                                <li key={d.title} className="flex gap-3">
                                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--color-primary-rgb),0.10)] text-[var(--color-primary)]">
                                        {d.icon}
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold text-gray-800">{d.title}</span>
                                        <span className="block text-xs text-gray-500 leading-relaxed">{d.text}</span>
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
                            <li>1. The office reviews your application.</li>
                            <li>2. You get a call for a short interview.</li>
                            <li>3. On approval you get an employee ID and your territory.</li>
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

function CheckInNote({ compact = false }: { compact?: boolean }) {
    return (
        <div
            className={`flex gap-3 rounded-xl border border-[rgba(var(--color-primary-rgb),0.25)] bg-[rgba(var(--color-primary-rgb),0.06)] p-4 ${compact ? '' : 'mt-6'}`}
        >
            <LuInfo size={17} className="mt-0.5 flex-shrink-0 text-[var(--color-primary)]" />
            <p className="text-xs sm:text-[13px] text-gray-700 leading-relaxed">
                <span className="font-bold text-[var(--color-primary)]">This role requires a daily location check-in.</span>{' '}
                You start and end each working day by sharing your GPS location from the officer panel, and every field
                visit is logged with where it happened.
            </p>
        </div>
    );
}

function DutyStrip() {
    return (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DUTIES.map((d) => (
                <div key={d.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(var(--color-primary-rgb),0.10)] text-[var(--color-primary)]">
                        {d.icon}
                    </span>
                    <p className="text-sm font-bold text-gray-800">{d.title}</p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{d.text}</p>
                </div>
            ))}
        </div>
    );
}
