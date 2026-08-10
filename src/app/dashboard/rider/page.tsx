"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    LuPackage,
    LuPhone,
    LuMessageCircle,
    LuMapPin,
    LuNavigation,
    LuCircleCheckBig,
    LuCircleX,
    LuLoaderCircle,
    LuPower,
    LuBanknote,
    LuCamera,
    LuX,
    LuTriangleAlert,
    LuLocateFixed,
    LuShieldCheck,
    LuRefreshCw,
    LuUserRound,
    LuClock,
    LuTruck,
    LuChevronRight,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import {
    useGetMyDeliveryManQuery,
    useGetMyAssignmentsQuery,
    useSetAvailabilityMutation,
    useUpdateAssignmentStatusMutation,
    usePushLocationMutation,
} from '@/redux/api/deliveryApi';
import { useUploadImageMutation } from '@/redux/api/uploadApi';

/* ─── Types ─── */
interface ShippingAddress {
    fullName?: string;
    phone?: string;
    address?: string;
    area?: string;
    city?: string;
    postalCode?: string;
}

interface OrderLite {
    _id?: string;
    orderId?: string;
    total?: number;
    status?: string;
    paymentMethod?: string;
    shippingAddress?: ShippingAddress;
    createdAt?: string;
    items?: unknown[];
}

interface Assignment {
    _id: string;
    order?: OrderLite | null;
    status: string;
    assignedAt?: string;
    pickedUpAt?: string | null;
    deliveredAt?: string | null;
    codAmount?: number;
    codCollected?: boolean;
    proofPhoto?: string;
    recipientName?: string;
    failureReason?: string;
}

/* ─── Constants ─── */

/** Everything the rider still has to do something about. */
const OPEN_STATUSES = ['assigned', 'picked_up', 'on_the_way'];

/** Roughly every 30s, per the dealer's live-tracking map. */
const LOCATION_INTERVAL_MS = 30_000;

const STAGE: Record<string, { label: string; tone: string; icon: React.ElementType }> = {
    assigned: { label: 'To pick up', tone: 'bg-blue-50 text-blue-700', icon: LuPackage },
    picked_up: { label: 'Picked up', tone: 'bg-indigo-50 text-indigo-700', icon: LuTruck },
    on_the_way: { label: 'On the way', tone: 'bg-sky-50 text-sky-700', icon: LuNavigation },
    delivered: { label: 'Delivered', tone: 'bg-emerald-50 text-emerald-700', icon: LuCircleCheckBig },
    failed: { label: 'Failed', tone: 'bg-red-50 text-red-700', icon: LuCircleX },
    returned: { label: 'Returned', tone: 'bg-gray-100 text-gray-600', icon: LuPackage },
};

/**
 * The forward move the big button makes. `delivered` is deliberately absent —
 * it needs the customer's code, so it always goes through the modal.
 */
const NEXT_STEP: Record<string, { status: string; label: string }> = {
    assigned: { status: 'picked_up', label: 'I have picked it up' },
    picked_up: { status: 'on_the_way', label: 'Heading to the customer' },
};

const FAILURE_REASONS = [
    'Customer did not answer the phone',
    'Nobody at the address',
    'Customer refused the parcel',
    'Wrong or incomplete address',
    'Customer asked for another day',
];

/* ─── Helpers ─── */
const TK = (n?: number) => `৳${Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

const errorMessage = (err: unknown, fallback: string) =>
    (err as { data?: { message?: string } } | null)?.data?.message || fallback;

/** Dialable form — keep a leading + but drop spaces, dashes and brackets. */
const telHref = (phone?: string) => `tel:${(phone || '').replace(/[^\d+]/g, '')}`;

/**
 * wa.me wants a bare international number. Bangladeshi numbers are typed as
 * 01XXXXXXXXX locally, so the leading 0 is dropped and 880 prefixed.
 */
const waHref = (phone?: string) => {
    let d = (phone || '').replace(/\D/g, '');
    if (!d) return '';
    if (!d.startsWith('880')) d = `880${d.replace(/^0+/, '')}`;
    return `https://wa.me/${d}`;
};

const fullAddress = (a?: ShippingAddress) =>
    [a?.address, a?.area, a?.city, a?.postalCode].filter(Boolean).join(', ');

const timeLabel = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

const isToday = (iso?: string | null) =>
    !!iso && new Date(iso).toDateString() === new Date().toDateString();

const btnBase =
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const fieldCls =
    'w-full min-h-[48px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 ' +
    'placeholder:text-gray-400 outline-none transition-colors ' +
    'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]';

const StagePill = ({ status }: { status: string }) => {
    const cfg = STAGE[status] || STAGE.assigned;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.tone}`}>
            <Icon size={12} /> {cfg.label}
        </span>
    );
};

/* ─── Page ─── */
export default function RiderTodayPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user as { role?: string } | null)?.role;
    const allowed = isAuthenticated && role === 'delivery_man';

    const { data: profileRes } = useGetMyDeliveryManQuery(undefined, { skip: !allowed });
    const {
        data: res,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetMyAssignmentsQuery(undefined, { skip: !allowed });

    const [setAvailability, { isLoading: switching }] = useSetAvailabilityMutation();
    const [updateStatus] = useUpdateAssignmentStatusMutation();
    const [pushLocation] = usePushLocationMutation();
    const [uploadImage] = useUploadImageMutation();

    const [busyId, setBusyId] = useState<string | null>(null);

    // ── Delivery proof modal ─────────────────────────
    const [deliverFor, setDeliverFor] = useState<Assignment | null>(null);
    const [otp, setOtp] = useState('');
    const [recipient, setRecipient] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState('');
    // Kept so a rejected OTP does not force the photo up the wire a second time.
    const [proofUrl, setProofUrl] = useState('');

    // ── Failure modal ────────────────────────────────
    const [failFor, setFailFor] = useState<Assignment | null>(null);
    const [reasonChoice, setReasonChoice] = useState(FAILURE_REASONS[0]);
    const [reasonOther, setReasonOther] = useState('');

    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // ── Location sharing ─────────────────────────────
    const [geoNotice, setGeoNotice] = useState<string | null>(null);
    const [geoDismissed, setGeoDismissed] = useState(false);
    const [lastPingAt, setLastPingAt] = useState<number | null>(null);

    const profile = profileRes?.data as { isAvailable?: boolean; totalDeliveries?: number } | undefined;
    const onDuty = Boolean(profile?.isAvailable);

    const assignments: Assignment[] = Array.isArray(res?.data) ? (res?.data as Assignment[]) : [];
    const openJobs = assignments.filter((a) => OPEN_STATUSES.includes(a.status));
    const doneToday = assignments.filter((a) => a.status === 'delivered' && isToday(a.deliveredAt));
    const codToday = doneToday.reduce((sum, a) => sum + (a.codCollected ? Number(a.codAmount || 0) : 0), 0);

    // Only one parcel is in the rider's hands at a time, so only that one gets
    // breadcrumbs — the first job already picked up or under way.
    const trackedId = openJobs.find((a) => a.status === 'picked_up' || a.status === 'on_the_way')?._id || null;

    useEffect(() => {
        if (!photo) {
            setPhotoPreview('');
            return;
        }
        const url = URL.createObjectURL(photo);
        setPhotoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [photo]);

    /**
     * Breadcrumbs while on duty. A denied permission is reported once and then
     * ignored — losing the map must never cost the rider their job list, so
     * nothing here throws and nothing here blocks a render.
     */
    useEffect(() => {
        if (!allowed || !onDuty || !trackedId) return;

        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setGeoNotice('This phone cannot share its location, so your dealer will not see you on the map. Deliveries still work normally.');
            return;
        }

        let stopped = false;
        const ping = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    if (stopped) return;
                    setGeoNotice(null);
                    setLastPingAt(Date.now());
                    // Fire and forget: `.unwrap()` is skipped on purpose so a
                    // dropped ping cannot surface as an unhandled rejection.
                    pushLocation({ id: trackedId, lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => {
                    if (stopped) return;
                    setGeoNotice(
                        err.code === err.PERMISSION_DENIED
                            ? 'Location is blocked for this site, so your dealer cannot follow you live. Turn it on in your browser settings — your deliveries work either way.'
                            : 'Your location could not be read just now. Your deliveries are not affected.',
                    );
                },
                { enableHighAccuracy: true, timeout: 20_000, maximumAge: 15_000 },
            );
        };

        ping();
        const timer = setInterval(ping, LOCATION_INTERVAL_MS);
        return () => {
            stopped = true;
            clearInterval(timer);
        };
    }, [allowed, onDuty, trackedId, pushLocation]);

    if (!allowed) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                    <LuShieldCheck size={26} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-2">Delivery riders only</h1>
                <p className="text-sm text-gray-500 mb-6">
                    This job list belongs to riders who carry parcels for a dealer.
                </p>
                <Link
                    href="/join"
                    className={`${btnBase} w-full min-h-[48px] bg-[var(--color-primary)] text-white text-sm hover:bg-[var(--color-primary-dark)]`}
                >
                    Join as a rider <LuChevronRight size={16} />
                </Link>
            </div>
        );
    }

    const toggleDuty = async () => {
        const next = !onDuty;
        try {
            await setAvailability(next).unwrap();
            toast.success(next ? 'You are on duty' : 'You are off duty');
        } catch (err) {
            toast.error(errorMessage(err, 'Could not change your duty status'));
        }
    };

    const advance = async (job: Assignment, status: string) => {
        setBusyId(job._id);
        try {
            await updateStatus({ id: job._id, status }).unwrap();
            toast.success(status === 'picked_up' ? 'Parcel picked up' : 'On your way');
        } catch (err) {
            toast.error(errorMessage(err, 'Could not update this delivery'));
        } finally {
            setBusyId(null);
        }
    };

    const closeDeliver = () => {
        setDeliverFor(null);
        setOtp('');
        setRecipient('');
        setPhoto(null);
        setProofUrl('');
        setFormError('');
    };

    const closeFail = () => {
        setFailFor(null);
        setReasonChoice(FAILURE_REASONS[0]);
        setReasonOther('');
        setFormError('');
    };

    const submitDelivery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deliverFor) return;

        const code = otp.trim();
        // The server refuses a delivery without a matching code; catching the
        // obvious case here saves the rider a round trip at the door.
        if (code.length !== 6) {
            setFormError('Enter the 6-digit code the customer reads out.');
            return;
        }

        setSubmitting(true);
        setFormError('');
        try {
            let uploaded = proofUrl;
            if (photo && !uploaded) {
                const form = new FormData();
                form.append('image', photo);
                const up = await uploadImage(form).unwrap();
                uploaded = up?.data?.url || '';
                setProofUrl(uploaded);
            }

            await updateStatus({
                id: deliverFor._id,
                status: 'delivered',
                otp: code,
                ...(uploaded ? { proofPhoto: uploaded } : {}),
                ...(recipient.trim() ? { recipientName: recipient.trim() } : {}),
            }).unwrap();

            toast.success('Delivered — nice work');
            closeDeliver();
        } catch (err) {
            // A wrong code comes back 400 with the server's own wording. Keep the
            // sheet open so the rider can ask the customer to read it again.
            setFormError(errorMessage(err, 'Could not complete this delivery'));
        } finally {
            setSubmitting(false);
        }
    };

    const submitFailure = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!failFor) return;

        const reason = (reasonChoice === 'other' ? reasonOther : reasonChoice).trim();
        if (!reason) {
            setFormError('Tell your dealer what went wrong.');
            return;
        }

        setSubmitting(true);
        setFormError('');
        try {
            await updateStatus({ id: failFor._id, status: 'failed', failureReason: reason }).unwrap();
            toast.success('Marked as failed — your dealer has been told');
            closeFail();
        } catch (err) {
            setFormError(errorMessage(err, 'Could not mark this delivery failed'));
        } finally {
            setSubmitting(false);
        }
    };

    // '' when the query is fine — the banner below is hidden on a falsy value.
    const blockedMessage = errorMessage(error, '');

    return (
        <div className="space-y-4">
            {/* ── Duty switch ── */}
            <button
                onClick={toggleDuty}
                disabled={switching}
                aria-pressed={onDuty}
                className={`w-full min-h-[76px] rounded-2xl px-5 py-4 flex items-center gap-4 text-left shadow-sm transition-colors disabled:opacity-70 ${
                    onDuty
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-500'
                }`}
            >
                <span
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        onDuty ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                >
                    {switching ? <LuLoaderCircle size={22} className="animate-spin" /> : <LuPower size={22} />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className={`block text-lg font-extrabold ${onDuty ? 'text-white' : 'text-gray-800'}`}>
                        {onDuty ? 'Available' : 'Off duty'}
                    </span>
                    <span className={`block text-xs ${onDuty ? 'text-emerald-50' : 'text-gray-400'}`}>
                        {onDuty
                            ? 'Your dealer can hand you new deliveries. Tap to go off duty.'
                            : 'You will not be given new deliveries. Tap to go available.'}
                    </span>
                </span>
                <span
                    className={`w-14 h-8 rounded-full p-1 shrink-0 flex ${
                        onDuty ? 'bg-white/30 justify-end' : 'bg-gray-200 justify-start'
                    }`}
                >
                    <span className={`w-6 h-6 rounded-full ${onDuty ? 'bg-white' : 'bg-white shadow'}`} />
                </span>
            </button>

            {/* ── Today at a glance ── */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: 'To do', value: String(openJobs.length), tone: 'text-[var(--color-primary)]' },
                    { label: 'Delivered', value: String(doneToday.length), tone: 'text-emerald-600' },
                    { label: 'COD today', value: TK(codToday), tone: 'text-gray-900' },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
                        <p className={`text-base font-extrabold mt-0.5 truncate ${s.tone}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Location notice ── */}
            {geoNotice && !geoDismissed && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
                    <LuTriangleAlert size={17} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed flex-1">{geoNotice}</p>
                    <button
                        onClick={() => setGeoDismissed(true)}
                        aria-label="Dismiss location notice"
                        className="w-9 h-9 -mr-1 -mt-1 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-100 shrink-0"
                    >
                        <LuX size={16} />
                    </button>
                </div>
            )}

            {onDuty && trackedId && !geoNotice && (
                <p className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 px-1">
                    <LuLocateFixed size={13} />
                    Sharing your location with the dealer
                    {lastPingAt ? ` · last sent ${new Date(lastPingAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
            )}

            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-3 px-1">
                <h1 className="text-lg font-bold text-gray-900">Today&apos;s jobs</h1>
                <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                    <LuRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {blockedMessage && !isLoading && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <LuTriangleAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Cannot load your deliveries</p>
                        <p className="text-xs text-amber-700 mt-0.5">{blockedMessage}</p>
                    </div>
                </div>
            )}

            {/* ── Jobs ── */}
            {isLoading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse space-y-3">
                            <div className="flex justify-between">
                                <div className="h-5 w-28 bg-gray-200 rounded" />
                                <div className="h-6 w-20 bg-gray-200 rounded" />
                            </div>
                            <div className="h-16 bg-gray-100 rounded-xl" />
                            <div className="h-12 bg-gray-100 rounded-xl" />
                        </div>
                    ))}
                </div>
            ) : openJobs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
                    <LuPackage size={44} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-base font-bold text-gray-600 mb-1">Nothing to deliver right now</h3>
                    <p className="text-sm text-gray-400">
                        {onDuty
                            ? 'Stay available — your dealer will send the next parcel your way.'
                            : 'You are off duty. Go available to start receiving deliveries.'}
                    </p>
                    {doneToday.length > 0 && (
                        <Link
                            href="/dashboard/rider/history"
                            className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)]"
                        >
                            See what you delivered <LuChevronRight size={15} />
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {openJobs.map((job) => {
                        const order = job.order || undefined;
                        const ship = order?.shippingAddress;
                        const phone = ship?.phone;
                        const address = fullAddress(ship);
                        // The assignment list only populates a slim order, so the
                        // count is shown when the API sends items and skipped otherwise.
                        const itemCount = order?.items?.length ?? null;
                        const cod = Number(job.codAmount || 0);
                        const step = NEXT_STEP[job.status];
                        const canDeliver = job.status === 'picked_up' || job.status === 'on_the_way';
                        const busy = busyId === job._id;

                        return (
                            <div key={job._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Head */}
                                <div className="p-4 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[var(--color-primary)] truncate">
                                            {order?.orderId || `#${String(order?._id || job._id).slice(-8).toUpperCase()}`}
                                        </p>
                                        <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                                            <LuClock size={11} /> Given to you at {timeLabel(job.assignedAt)}
                                            {itemCount !== null && <span>· {itemCount} item{itemCount === 1 ? '' : 's'}</span>}
                                        </p>
                                    </div>
                                    <StagePill status={job.status} />
                                </div>

                                {/* Customer */}
                                <div className="px-4 pb-4 space-y-2.5 border-b border-gray-50">
                                    <div className="flex items-start gap-2.5">
                                        <LuUserRound size={15} className="text-gray-300 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {ship?.fullName || 'Customer'}
                                            </p>
                                            {phone ? (
                                                <a href={telHref(phone)} className="text-xs font-semibold text-[var(--color-primary)]">
                                                    {phone}
                                                </a>
                                            ) : (
                                                <p className="text-xs text-gray-400">No phone on file</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <LuMapPin size={15} className="text-gray-300 shrink-0 mt-0.5" />
                                        <p className="text-[13px] text-gray-600 leading-relaxed">
                                            {address || 'No address on this order — call the customer.'}
                                        </p>
                                    </div>

                                    {cod > 0 ? (
                                        <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                                            <LuBanknote size={17} className="text-amber-600 shrink-0" />
                                            <p className="text-[13px] font-bold text-amber-800">
                                                Collect {TK(cod)} in cash
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
                                            <LuCircleCheckBig size={12} /> Already paid — collect nothing
                                        </p>
                                    )}
                                </div>

                                {/* Contact */}
                                <div className="grid grid-cols-2 gap-2 p-4 pb-0">
                                    <a
                                        href={phone ? telHref(phone) : undefined}
                                        aria-disabled={!phone}
                                        className={`${btnBase} min-h-[48px] text-sm ${
                                            phone
                                                ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
                                                : 'bg-gray-100 text-gray-400 pointer-events-none'
                                        }`}
                                    >
                                        <LuPhone size={16} /> Call
                                    </a>
                                    <a
                                        href={phone ? waHref(phone) : undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-disabled={!phone}
                                        className={`${btnBase} min-h-[48px] text-sm ${
                                            phone
                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                : 'bg-gray-100 text-gray-400 pointer-events-none'
                                        }`}
                                    >
                                        <LuMessageCircle size={16} /> WhatsApp
                                    </a>
                                </div>

                                {/* Actions */}
                                <div className="p-4 space-y-2">
                                    {job.status === 'on_the_way' ? (
                                        <button
                                            onClick={() => { setDeliverFor(job); setFormError(''); }}
                                            className={`${btnBase} w-full min-h-[54px] bg-emerald-600 text-white text-base hover:bg-emerald-700`}
                                        >
                                            <LuCircleCheckBig size={19} /> Delivered
                                        </button>
                                    ) : (
                                        step && (
                                            <button
                                                onClick={() => advance(job, step.status)}
                                                disabled={busy}
                                                className={`${btnBase} w-full min-h-[54px] bg-[var(--color-primary)] text-white text-base hover:bg-[var(--color-primary-dark)]`}
                                            >
                                                {busy ? <LuLoaderCircle size={19} className="animate-spin" /> : <LuNavigation size={18} />}
                                                {step.label}
                                            </button>
                                        )
                                    )}

                                    {canDeliver && job.status !== 'on_the_way' && (
                                        <button
                                            onClick={() => { setDeliverFor(job); setFormError(''); }}
                                            className={`${btnBase} w-full min-h-[48px] border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm hover:bg-emerald-100`}
                                        >
                                            <LuCircleCheckBig size={16} /> Delivered now
                                        </button>
                                    )}

                                    <button
                                        onClick={() => { setFailFor(job); setFormError(''); }}
                                        className={`${btnBase} w-full min-h-[44px] text-[13px] text-gray-400 hover:text-red-600`}
                                    >
                                        <LuCircleX size={15} /> Could not deliver
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Delivery proof sheet ── */}
            {deliverFor && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-gray-900">Confirm the handover</h2>
                                <p className="text-[11px] text-gray-400 truncate">
                                    {deliverFor.order?.orderId || 'This delivery'} · {deliverFor.order?.shippingAddress?.fullName || 'Customer'}
                                </p>
                            </div>
                            <button
                                onClick={closeDeliver}
                                aria-label="Close"
                                className="w-11 h-11 -mr-2 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 shrink-0"
                            >
                                <LuX size={19} />
                            </button>
                        </div>

                        <form onSubmit={submitDelivery} className="p-5 space-y-4">
                            <div>
                                <label htmlFor="rider-otp" className="block text-xs font-bold text-gray-500 mb-2">
                                    Ask the customer for their 6-digit code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="rider-otp"
                                    autoFocus
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setFormError(''); }}
                                    placeholder="------"
                                    className={`${fieldCls} text-center text-2xl font-extrabold tracking-[0.5em] min-h-[60px]`}
                                />
                                <p className="text-[11px] text-gray-400 mt-2">
                                    The code is on the customer&apos;s order page. Without it the parcel cannot be closed.
                                </p>
                            </div>

                            {Number(deliverFor.codAmount || 0) > 0 && (
                                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-3">
                                    <LuBanknote size={17} className="text-amber-600 shrink-0" />
                                    <p className="text-[13px] font-bold text-amber-800">
                                        Take {TK(deliverFor.codAmount)} in cash before you confirm
                                    </p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="rider-recipient" className="block text-xs font-bold text-gray-500 mb-2">
                                    Who took it? <span className="font-medium text-gray-400">(optional)</span>
                                </label>
                                <input
                                    id="rider-recipient"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder="Name of the person at the door"
                                    className={fieldCls}
                                />
                            </div>

                            <div>
                                <p className="block text-xs font-bold text-gray-500 mb-2">
                                    Photo proof <span className="font-medium text-gray-400">(optional)</span>
                                </p>
                                {photoPreview ? (
                                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                                        {/* Local object URL — next/image would need a remote loader */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={photoPreview} alt="Delivery proof" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                                        <p className="flex-1 min-w-0 text-xs text-gray-500 truncate">{photo?.name}</p>
                                        <button
                                            type="button"
                                            onClick={() => { setPhoto(null); setProofUrl(''); }}
                                            aria-label="Remove photo"
                                            className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 shrink-0"
                                        >
                                            <LuX size={17} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className={`${btnBase} w-full min-h-[48px] border border-dashed border-gray-300 text-sm text-gray-500 cursor-pointer hover:bg-gray-50`}>
                                        <LuCamera size={17} /> Take a photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                )}
                            </div>

                            {formError && (
                                <p className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs font-semibold text-red-700">
                                    <LuTriangleAlert size={14} className="shrink-0 mt-0.5" /> {formError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || otp.length !== 6}
                                className={`${btnBase} w-full min-h-[54px] bg-emerald-600 text-white text-base hover:bg-emerald-700`}
                            >
                                {submitting ? <LuLoaderCircle size={19} className="animate-spin" /> : <LuCircleCheckBig size={19} />}
                                Confirm delivery
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Failure sheet ── */}
            {failFor && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-gray-900">What went wrong?</h2>
                                <p className="text-[11px] text-gray-400 truncate">
                                    {failFor.order?.orderId || 'This delivery'} — your dealer sees this reason
                                </p>
                            </div>
                            <button
                                onClick={closeFail}
                                aria-label="Close"
                                className="w-11 h-11 -mr-2 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 shrink-0"
                            >
                                <LuX size={19} />
                            </button>
                        </div>

                        <form onSubmit={submitFailure} className="p-5 space-y-3">
                            {[...FAILURE_REASONS, 'other'].map((r) => (
                                <label
                                    key={r}
                                    className={`flex items-center gap-3 min-h-[48px] px-4 rounded-xl border cursor-pointer transition-colors ${
                                        reasonChoice === r
                                            ? 'border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.06)]'
                                            : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="failure-reason"
                                        value={r}
                                        checked={reasonChoice === r}
                                        onChange={() => { setReasonChoice(r); setFormError(''); }}
                                        className="w-5 h-5 accent-[var(--color-primary)] shrink-0"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">
                                        {r === 'other' ? 'Something else' : r}
                                    </span>
                                </label>
                            ))}

                            {reasonChoice === 'other' && (
                                <textarea
                                    autoFocus
                                    rows={3}
                                    value={reasonOther}
                                    onChange={(e) => { setReasonOther(e.target.value); setFormError(''); }}
                                    placeholder="Write what happened"
                                    className={`${fieldCls} min-h-[92px] resize-none`}
                                />
                            )}

                            {formError && (
                                <p className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs font-semibold text-red-700">
                                    <LuTriangleAlert size={14} className="shrink-0 mt-0.5" /> {formError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`${btnBase} w-full min-h-[54px] bg-red-600 text-white text-base hover:bg-red-700`}
                            >
                                {submitting ? <LuLoaderCircle size={19} className="animate-spin" /> : <LuCircleX size={19} />}
                                Mark as failed
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
