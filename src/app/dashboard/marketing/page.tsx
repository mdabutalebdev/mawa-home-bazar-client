"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    LuLockKeyhole, LuLogIn, LuLogOut, LuMapPin, LuCrosshair, LuTriangleAlert,
    LuUsers, LuHandshake, LuPackage, LuTrendingUp, LuNotebookPen, LuLoaderCircle,
    LuClock, LuCircleCheck, LuPlus, LuStore, LuClipboardList, LuChevronRight,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import {
    useGetMyReportsQuery,
    useCheckInMutation,
    useCheckOutMutation,
    useAddVisitMutation,
    useSaveDailyReportMutation,
} from '@/redux/api/marketingApi';

/* ─── Types ─── */
interface Stamp { at?: string | null; lat?: number | null; lng?: number | null; address?: string }
interface Visit {
    _id?: string;
    name?: string;
    type?: string;
    contact?: string;
    note?: string;
    outcome?: string;
    at?: string;
    lat?: number | null;
    lng?: number | null;
}
interface DailyReport {
    _id?: string;
    date?: string;
    checkIn?: Stamp;
    checkOut?: Stamp;
    visits?: Visit[];
    newDealers?: number;
    newRetailers?: number;
    ordersCollected?: number;
    salesValue?: number;
    summary?: string;
}

interface Coords { lat: number; lng: number }

/* ─── Constants ─── */
const VISIT_TYPES = [
    { value: 'retailer', label: 'Retail shop' },
    { value: 'dealer', label: 'Dealer' },
    { value: 'company', label: 'Company' },
    { value: 'customer', label: 'Customer' },
    { value: 'other', label: 'Other' },
];

const OUTCOMES = [
    { value: 'interested', label: 'Interested' },
    { value: 'ordered', label: 'Placed an order' },
    { value: 'follow_up', label: 'Needs follow-up' },
    { value: 'not_interested', label: 'Not interested' },
    { value: 'other', label: 'Other' },
];

const OUTCOME_TONE: Record<string, string> = {
    interested: 'bg-blue-50 text-blue-700',
    ordered: 'bg-emerald-50 text-emerald-700',
    follow_up: 'bg-amber-50 text-amber-700',
    not_interested: 'bg-gray-100 text-gray-600',
    other: 'bg-gray-100 text-gray-600',
};

/** Bangladesh is UTC+6 all year — the server keys a field day the same way. */
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const dhakaToday = () => new Date(Date.now() + DHAKA_OFFSET_MS).toISOString().slice(0, 10);

const timeLabel = (iso?: string | null) =>
    iso
        ? new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' })
        : '—';

const taka = (n?: number) => `৳${Number(n || 0).toLocaleString()}`;

const inputCls =
    'w-full min-h-[44px] px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 ' +
    'placeholder:text-gray-400 outline-none transition-colors ' +
    'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]';

const labelCls = 'block text-xs font-bold text-gray-500 mb-2';

const errorMessage = (err: unknown, fallback: string) =>
    (err as { data?: { message?: string } })?.data?.message || fallback;

const emptyVisit = { name: '', type: 'retailer', contact: '', note: '', outcome: 'interested' };

const Counter = ({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${tone}`}><Icon size={17} /></div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
);

export default function MarketingTodayPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user as { role?: string } | null)?.role;
    const allowed = isAuthenticated && role === 'marketing_officer';

    const today = dhakaToday();
    const { data: res, isLoading } = useGetMyReportsQuery(
        { from: today, to: today, limit: 1 },
        { skip: !allowed },
    );
    const report: DailyReport | undefined = res?.data?.reports?.[0];

    const [checkIn, { isLoading: checkingIn }] = useCheckInMutation();
    const [checkOut, { isLoading: checkingOut }] = useCheckOutMutation();
    const [addVisit, { isLoading: savingVisit }] = useAddVisitMutation();
    const [saveDailyReport, { isLoading: savingReport }] = useSaveDailyReportMutation();

    // ── Location ──────────────────────────────────────
    const [coords, setCoords] = useState<Coords | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);

    /**
     * Resolves to coordinates, or null with `geoError` set. It never throws and
     * never blocks: a denied permission only costs the officer the two clock
     * stamps, and they can still log visits and file the day's report.
     */
    const readLocation = (): Promise<Coords | null> =>
        new Promise((resolve) => {
            if (typeof navigator === 'undefined' || !navigator.geolocation) {
                setGeoError('This device cannot share its location.');
                resolve(null);
                return;
            }
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setLocating(false);
                    setGeoError(null);
                    setCoords(next);
                    resolve(next);
                },
                (err) => {
                    setLocating(false);
                    setGeoError(
                        err.code === err.PERMISSION_DENIED
                            ? 'Location is blocked for this site. Check-in and check-out need coordinates, so turn location on in your browser settings — everything else on this page still works without it.'
                            : 'Your location could not be read right now. You can still log visits and file the day’s report without it.',
                    );
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
            );
        });

    // ── Visit form ────────────────────────────────────
    const [visit, setVisit] = useState(emptyVisit);
    const setVisitField = (key: keyof typeof emptyVisit, value: string) =>
        setVisit((v) => ({ ...v, [key]: value }));

    // ── Daily summary form ────────────────────────────
    const [summaryForm, setSummaryForm] = useState({
        newDealers: '0', newRetailers: '0', ordersCollected: '0', salesValue: '0', summary: '',
    });

    // Today's row is built up through the day, so refill the form whenever a
    // fresh copy lands — otherwise a saved number would be overwritten by stale
    // zeros on the next save.
    useEffect(() => {
        if (!report) return;
        setSummaryForm({
            newDealers: String(report.newDealers ?? 0),
            newRetailers: String(report.newRetailers ?? 0),
            ordersCollected: String(report.ordersCollected ?? 0),
            salesValue: String(report.salesValue ?? 0),
            summary: report.summary || '',
        });
    }, [report]);

    if (!allowed) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                    <LuLockKeyhole size={26} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-2">Field officers only</h1>
                <p className="text-sm text-gray-500 mb-6">Apply to the field team to check in and file daily reports.</p>
                <Link href="/join/marketing-officer" className="inline-block px-5 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
                    Apply as an officer
                </Link>
            </div>
        );
    }

    const checkedIn = Boolean(report?.checkIn?.at);
    const checkedOut = Boolean(report?.checkOut?.at);
    const visits = report?.visits || [];

    const handleCheckIn = async () => {
        // Always take a fresh fix — a cached morning position would make the
        // stamp meaningless.
        const pos = await readLocation();
        if (!pos) {
            toast.error('Check-in needs your location');
            return;
        }
        try {
            await checkIn({ lat: pos.lat, lng: pos.lng }).unwrap();
            toast.success('Checked in for today');
        } catch (err) {
            toast.error(errorMessage(err, 'Could not check in'));
        }
    };

    const handleCheckOut = async () => {
        const pos = await readLocation();
        if (!pos) {
            toast.error('Check-out needs your location');
            return;
        }
        try {
            await checkOut({ lat: pos.lat, lng: pos.lng }).unwrap();
            toast.success('Checked out — have a good evening');
        } catch (err) {
            toast.error(errorMessage(err, 'Could not check out'));
        }
    };

    const handleAddVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visit.name.trim()) {
            toast.error('Who did you visit?');
            return;
        }
        try {
            // lat/lng are omitted rather than sent as null — the API rejects
            // nulls, and a visit without coordinates is perfectly valid.
            await addVisit({
                name: visit.name.trim(),
                type: visit.type,
                contact: visit.contact.trim(),
                note: visit.note.trim(),
                outcome: visit.outcome,
                ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
            }).unwrap();
            toast.success('Visit logged');
            setVisit(emptyVisit);
        } catch (err) {
            toast.error(errorMessage(err, 'Could not log the visit'));
        }
    };

    const handleSaveSummary = async (e: React.FormEvent) => {
        e.preventDefault();
        const num = (v: string) => Math.max(0, Number(v) || 0);
        try {
            await saveDailyReport({
                newDealers: num(summaryForm.newDealers),
                newRetailers: num(summaryForm.newRetailers),
                ordersCollected: num(summaryForm.ordersCollected),
                salesValue: num(summaryForm.salesValue),
                summary: summaryForm.summary.trim(),
            }).unwrap();
            toast.success("Today's report saved");
        } catch (err) {
            toast.error(errorMessage(err, 'Could not save the report'));
        }
    };

    return (
        <div className="space-y-4 sm:space-y-5 max-w-4xl">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Today&apos;s work</h1>
                        <p className="text-xs text-gray-400 mt-1">
                            {new Date(`${today}T00:00:00Z`).toLocaleDateString('en-GB', {
                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
                            })}
                        </p>
                    </div>
                    <Link
                        href="/dashboard/marketing/reports"
                        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--color-primary)]"
                    >
                        <LuClipboardList size={15} /> Past reports <LuChevronRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Location notice — never a blocker, only an explanation */}
            {geoError && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                    <LuTriangleAlert size={17} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[13px] font-bold text-amber-800">Location unavailable</p>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">{geoError}</p>
                    </div>
                </div>
            )}

            {/* Check in / out */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Attendance</h2>

                {isLoading ? (
                    <div className="h-24 bg-gray-50 rounded-xl animate-pulse" />
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className={`rounded-xl p-3.5 ${checkedIn ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                    <LuLogIn size={12} /> Check-in
                                </p>
                                <p className={`text-lg font-bold mt-1 ${checkedIn ? 'text-emerald-700' : 'text-gray-400'}`}>
                                    {timeLabel(report?.checkIn?.at)}
                                </p>
                            </div>
                            <div className={`rounded-xl p-3.5 ${checkedOut ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                    <LuLogOut size={12} /> Check-out
                                </p>
                                <p className={`text-lg font-bold mt-1 ${checkedOut ? 'text-indigo-700' : 'text-gray-400'}`}>
                                    {timeLabel(report?.checkOut?.at)}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <button
                                onClick={handleCheckIn}
                                disabled={checkedIn || checkingIn || locating}
                                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-45 hover:opacity-90 transition-opacity"
                            >
                                {(checkingIn || locating) && !checkedIn
                                    ? <LuLoaderCircle size={16} className="animate-spin" />
                                    : <LuCrosshair size={16} />}
                                {checkedIn ? 'Already checked in' : 'Check in with my location'}
                            </button>
                            <button
                                onClick={handleCheckOut}
                                disabled={!checkedIn || checkedOut || checkingOut}
                                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold disabled:opacity-45 hover:bg-gray-50 transition-colors"
                            >
                                {checkingOut ? <LuLoaderCircle size={16} className="animate-spin" /> : <LuLogOut size={16} />}
                                {checkedOut ? 'Day closed' : 'Check out'}
                            </button>
                        </div>

                        {!checkedIn && (
                            <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
                                <LuMapPin size={12} className="shrink-0 mt-0.5" />
                                Your browser will ask for location permission. If you deny it, the two clock
                                stamps stay empty but you can still log visits and file the report.
                            </p>
                        )}
                        {coords && (
                            <p className="text-[11px] text-gray-400 mt-3">
                                Last fix: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                            </p>
                        )}
                    </>
                )}
            </div>

            {/* Today's counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Counter icon={LuStore} label="Visits today" value={String(visits.length)} tone="bg-blue-50 text-blue-500" />
                <Counter icon={LuHandshake} label="New dealers" value={String(report?.newDealers || 0)} tone="bg-purple-50 text-purple-500" />
                <Counter icon={LuUsers} label="New retailers" value={String(report?.newRetailers || 0)} tone="bg-emerald-50 text-emerald-500" />
                <Counter icon={LuTrendingUp} label="Sales value" value={taka(report?.salesValue)} tone="bg-amber-50 text-amber-500" />
            </div>

            {/* Log a visit */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-sm font-bold text-gray-900">Log a visit</h2>
                    <button
                        type="button"
                        onClick={() => readLocation()}
                        disabled={locating}
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-primary)] disabled:opacity-50"
                    >
                        {locating ? <LuLoaderCircle size={13} className="animate-spin" /> : <LuCrosshair size={13} />}
                        {coords ? 'Refresh location' : 'Attach my location'}
                    </button>
                </div>

                <form onSubmit={handleAddVisit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls} htmlFor="visitName">Who did you visit? <span className="text-red-500">*</span></label>
                            <input id="visitName" className={inputCls} value={visit.name} onChange={(e) => setVisitField('name', e.target.value)} placeholder="Shop or person's name" />
                        </div>
                        <div>
                            <label className={labelCls} htmlFor="visitType">Type</label>
                            <select id="visitType" className={inputCls} value={visit.type} onChange={(e) => setVisitField('type', e.target.value)}>
                                {VISIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls} htmlFor="visitContact">Contact number</label>
                            <input id="visitContact" className={inputCls} inputMode="tel" value={visit.contact} onChange={(e) => setVisitField('contact', e.target.value)} placeholder="01XXXXXXXXX" />
                        </div>
                        <div>
                            <label className={labelCls} htmlFor="visitOutcome">Outcome</label>
                            <select id="visitOutcome" className={inputCls} value={visit.outcome} onChange={(e) => setVisitField('outcome', e.target.value)}>
                                {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelCls} htmlFor="visitNote">Note</label>
                            <textarea id="visitNote" rows={2} className={`${inputCls} resize-y`} value={visit.note} onChange={(e) => setVisitField('note', e.target.value)} placeholder="What was discussed, what to follow up on" />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={savingVisit}
                            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
                        >
                            {savingVisit ? <LuLoaderCircle size={16} className="animate-spin" /> : <LuPlus size={16} />}
                            Add visit
                        </button>
                        <span className="text-[11px] text-gray-400">
                            {coords
                                ? 'Coordinates will be attached to this visit.'
                                : 'No location attached — the visit is saved without coordinates.'}
                        </span>
                    </div>
                </form>

                {/* Today's visits */}
                <div className="mt-5 pt-5 border-t border-gray-50">
                    {isLoading ? (
                        <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                    ) : visits.length === 0 ? (
                        <div className="text-center py-6">
                            <LuNotebookPen size={30} className="mx-auto text-gray-200 mb-2.5" />
                            <p className="text-sm font-bold text-gray-600">No visits logged yet</p>
                            <p className="text-xs text-gray-400 mt-1">Each shop you call on today shows up here.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2.5">
                            {visits.map((v, i) => (
                                <li key={v._id || i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/70">
                                    <div className="w-8 h-8 rounded-lg bg-white text-gray-400 flex items-center justify-center shrink-0">
                                        <LuStore size={15} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-[13px] font-bold text-gray-900 truncate">{v.name}</p>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${OUTCOME_TONE[v.outcome || 'other']}`}>
                                                {OUTCOMES.find((o) => o.value === v.outcome)?.label || 'Other'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-0.5 capitalize">
                                            {v.type || 'other'}
                                            {v.contact ? ` · ${v.contact}` : ''}
                                            {v.at ? ` · ${timeLabel(v.at)}` : ''}
                                            {typeof v.lat === 'number' ? ' · location saved' : ''}
                                        </p>
                                        {v.note && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{v.note}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Daily summary */}
            <form onSubmit={handleSaveSummary} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <LuNotebookPen size={16} className="text-gray-400" />
                    <h2 className="text-sm font-bold text-gray-900">Daily summary</h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className={labelCls} htmlFor="newDealers">New dealers</label>
                        <input id="newDealers" type="number" min={0} inputMode="numeric" className={inputCls}
                            value={summaryForm.newDealers}
                            onChange={(e) => setSummaryForm((f) => ({ ...f, newDealers: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="newRetailers">New retailers</label>
                        <input id="newRetailers" type="number" min={0} inputMode="numeric" className={inputCls}
                            value={summaryForm.newRetailers}
                            onChange={(e) => setSummaryForm((f) => ({ ...f, newRetailers: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="ordersCollected">Orders collected</label>
                        <input id="ordersCollected" type="number" min={0} inputMode="numeric" className={inputCls}
                            value={summaryForm.ordersCollected}
                            onChange={(e) => setSummaryForm((f) => ({ ...f, ordersCollected: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="salesValue">Sales value (৳)</label>
                        <input id="salesValue" type="number" min={0} inputMode="numeric" className={inputCls}
                            value={summaryForm.salesValue}
                            onChange={(e) => setSummaryForm((f) => ({ ...f, salesValue: e.target.value }))} />
                    </div>
                </div>

                <div>
                    <label className={labelCls} htmlFor="summary">Notes for the day</label>
                    <textarea id="summary" rows={3} className={`${inputCls} resize-y`}
                        value={summaryForm.summary}
                        onChange={(e) => setSummaryForm((f) => ({ ...f, summary: e.target.value }))}
                        placeholder="Areas covered, problems faced, what needs follow-up tomorrow" />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="submit"
                        disabled={savingReport}
                        className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
                    >
                        {savingReport ? <LuLoaderCircle size={16} className="animate-spin" /> : <LuCircleCheck size={16} />}
                        Save today&apos;s report
                    </button>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                        <LuClock size={12} /> You can revise these numbers any time today.
                    </span>
                </div>

                {geoError && (
                    <p className="text-[11px] text-gray-400 flex items-start gap-1.5">
                        <LuPackage size={12} className="shrink-0 mt-0.5" />
                        Filing this report does not need your location — save it as normal.
                    </p>
                )}
            </form>
        </div>
    );
}
