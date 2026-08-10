"use client";

/**
 * The owner's partner inbox.
 *
 * Every partner type (dealer / company / retailer / marketing officer) shares
 * the same apply → approve lifecycle on the server, so one page with four tabs
 * beats four near-identical screens. Each tab normalises its own document shape
 * into a common `Row` and hands it to the same renderer.
 */

import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    LuShieldCheck, LuRefreshCw, LuHandshake, LuBuilding2, LuStore, LuBriefcase,
    LuCheck, LuX, LuBan, LuMapPin, LuPhone, LuMail, LuPercent, LuIdCard,
    LuTriangleAlert, LuInbox, LuLoaderCircle, LuChevronLeft, LuChevronRight,
    LuCalendar, LuUserCheck, LuFileText,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import {
    useGetDealersQuery,
    useApproveDealerMutation,
    useRejectDealerMutation,
    useSuspendDealerMutation,
    useUpdateDealerMutation,
} from '@/redux/api/dealerApi';
import {
    useGetCompaniesQuery,
    useApproveCompanyMutation,
    useRejectCompanyMutation,
    useSuspendCompanyMutation,
    useUpdateCompanyMutation,
} from '@/redux/api/companyApi';
import {
    useGetRetailersQuery,
    useApproveRetailerMutation,
    useRejectRetailerMutation,
    useSuspendRetailerMutation,
} from '@/redux/api/retailerApi';
import {
    useGetMarketingOfficersQuery,
    useApproveMarketingOfficerMutation,
    useRejectMarketingOfficerMutation,
    useSuspendMarketingOfficerMutation,
} from '@/redux/api/marketingApi';

const LIMIT = 10;

type Kind = 'dealers' | 'companies' | 'retailers' | 'officers';
type Status = 'pending' | 'approved' | 'suspended' | 'rejected';

const STATUSES: { id: Status; label: string }[] = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'suspended', label: 'Suspended' },
    { id: 'rejected', label: 'Rejected' },
];

const STATUS_PILL: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    suspended: 'bg-orange-50 text-orange-700 border-orange-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
};

const TABS: { id: Kind; label: string; short: string; icon: React.ElementType; hasCommission: boolean }[] = [
    { id: 'dealers', label: 'Dealers', short: 'Dealers', icon: LuHandshake, hasCommission: true },
    { id: 'companies', label: 'Companies', short: 'Companies', icon: LuBuilding2, hasCommission: true },
    { id: 'retailers', label: 'Retailers', short: 'Retailers', icon: LuStore, hasCommission: false },
    { id: 'officers', label: 'Marketing Officers', short: 'Officers', icon: LuBriefcase, hasCommission: false },
];

const SHOP_TYPE: Record<string, string> = {
    grocery: 'Grocery shop',
    pharmacy: 'Pharmacy',
    electronics: 'Electronics shop',
    cosmetics: 'Cosmetics shop',
    stationery: 'Stationery shop',
    hardware: 'Hardware shop',
    other: 'Shop',
};

// Uploads come back as absolute URLs, but older rows may hold a bare /uploads
// path — resolve those against the API origin so the thumbnail still loads.
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const imgSrc = (u?: string) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u) || u.startsWith('data:')) return u;
    return `${API_ORIGIN}${u.startsWith('/') ? '' : '/'}${u}`;
};

const fullName = (u: any) => `${u?.firstName || ''} ${u?.lastName || ''}`.trim();
/** Populated geo docs are objects; unpopulated ones are bare ids we cannot name. */
const geoName = (g: any) => (g && typeof g === 'object' ? (g.name || g.bnName || '') : '');

const formatDate = (d?: string) => {
    if (!d) return '—';
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface DocRef {
    label: string;
    number?: string;
    image?: string;
}

interface Row {
    id: string;
    title: string;
    subtitle: string;
    holderName: string;
    email: string;
    phone: string;
    upazila: string;
    district: string;
    docs: DocRef[];
    appliedAt: string;
    status: string;
    rejectionReason: string;
    /** null for partner types that carry no commission. */
    commissionRate: number | null;
}

const normalise = (kind: Kind, d: any): Row => {
    const base = {
        id: String(d?._id || ''),
        holderName: fullName(d?.user),
        email: d?.user?.email || '',
        appliedAt: d?.createdAt || '',
        status: d?.status || 'pending',
        rejectionReason: d?.rejectionReason || '',
    };

    if (kind === 'dealers') {
        return {
            ...base,
            title: d?.name || 'Unnamed dealer',
            subtitle: d?.address || '',
            phone: d?.phone || d?.user?.phone || '',
            upazila: geoName(d?.upazila),
            district: geoName(d?.district),
            docs: [
                { label: 'NID', number: d?.nid, image: d?.nidImage },
                { label: 'Trade licence', number: d?.tradeLicense, image: d?.tradeLicenseImage },
                { label: 'Shop photo', image: d?.shopImage },
            ],
            commissionRate: Number(d?.commissionRate ?? 0),
        };
    }

    if (kind === 'companies') {
        return {
            ...base,
            title: d?.name || 'Unnamed company',
            subtitle: d?.type === 'service' ? 'Service company' : 'Product company',
            phone: d?.phone || d?.user?.phone || '',
            // A company sells nationwide, so its head office is all the area there is.
            upazila: geoName(d?.upazila),
            district: geoName(d?.district),
            docs: [
                { label: 'Trade licence', number: d?.tradeLicense, image: d?.tradeLicenseImage },
                { label: 'TIN', number: d?.tin },
                { label: 'BIN', number: d?.bin },
            ],
            commissionRate: Number(d?.commissionRate ?? 0),
        };
    }

    if (kind === 'retailers') {
        return {
            ...base,
            title: d?.shopName || 'Unnamed shop',
            subtitle: [SHOP_TYPE[d?.shopType] || 'Shop', d?.ownerName].filter(Boolean).join(' · '),
            phone: d?.phone || d?.user?.phone || '',
            upazila: geoName(d?.upazila),
            district: geoName(d?.district),
            docs: [
                { label: 'NID', number: d?.nid, image: d?.nidImage },
                { label: 'Trade licence', number: d?.tradeLicense, image: d?.tradeLicenseImage },
                { label: 'Shop photo', image: d?.shopImage },
            ],
            commissionRate: null,
        };
    }

    // Marketing officers work a beat of several upazilas rather than one area.
    const beat: string[] = Array.isArray(d?.assignedUpazilas)
        ? d.assignedUpazilas.map(geoName).filter(Boolean)
        : [];
    return {
        ...base,
        title: fullName(d?.user) || d?.employeeId || 'Field officer',
        subtitle: d?.employeeId ? `Employee ${d.employeeId}` : 'Marketing officer',
        phone: d?.phone || d?.user?.phone || '',
        upazila: beat.join(', '),
        district: '',
        docs: [
            { label: 'NID', number: d?.nid, image: d?.nidImage },
            { label: 'Photo', image: d?.photo },
        ],
        commissionRate: null,
    };
};

// ── Small presentational pieces ─────────────────────────────

const RoleGate = () => (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
            <LuShieldCheck size={26} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Owner access only</h1>
        <p className="text-sm text-gray-500 mt-2">
            Approving dealers, companies, retailers and field officers is the marketplace owner&apos;s job.
            Sign in with an admin account to open this inbox.
        </p>
    </div>
);

const StatusPill = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold capitalize ${STATUS_PILL[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
        {status || 'unknown'}
    </span>
);

const DocChips = ({ docs }: { docs: DocRef[] }) => {
    const present = docs.filter((d) => d.number || d.image);
    if (!present.length) {
        return <span className="text-xs text-gray-400 italic">No documents uploaded</span>;
    }
    return (
        <div className="flex flex-wrap items-center gap-2">
            {present.map((doc) => {
                const src = imgSrc(doc.image);
                return (
                    <div key={doc.label} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
                        {src ? (
                            <a
                                href={src}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Open ${doc.label}`}
                                className="block w-8 h-8 rounded-md overflow-hidden bg-white border border-gray-200 shrink-0"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt={doc.label} className="w-full h-full object-cover" />
                            </a>
                        ) : (
                            <span className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-300 shrink-0">
                                <LuFileText size={14} />
                            </span>
                        )}
                        <span className="min-w-0">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-tight">
                                {doc.label}
                            </span>
                            <span className="block text-[11px] font-semibold text-gray-700 font-mono truncate max-w-[110px]">
                                {doc.number || (src ? 'Image only' : '—')}
                            </span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const AreaCell = ({ row }: { row: Row }) => {
    if (!row.upazila && !row.district) {
        return <span className="text-xs text-gray-400 italic">No area on file</span>;
    }
    return (
        <div className="flex items-start gap-1.5 min-w-0">
            <LuMapPin size={13} className="text-gray-300 shrink-0 mt-0.5" />
            <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-800 break-words">{row.upazila || '—'}</span>
                {row.district && <span className="block text-[11px] text-gray-400">{row.district} district</span>}
            </span>
        </div>
    );
};

const HolderCell = ({ row }: { row: Row }) => (
    <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-gray-800 truncate">{row.holderName || 'Unnamed account'}</p>
        {row.email && (
            <a href={`mailto:${row.email}`} className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-[var(--color-primary)] truncate">
                <LuMail size={11} className="shrink-0" /> <span className="truncate">{row.email}</span>
            </a>
        )}
        {row.phone ? (
            <a href={`tel:${row.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-primary)] hover:underline">
                <LuPhone size={11} className="shrink-0" /> {row.phone}
            </a>
        ) : (
            <p className="text-[11px] text-gray-400">No phone on file</p>
        )}
    </div>
);

// ── Page ────────────────────────────────────────────────────

export default function AdminPartnersPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = (user?.role || '') as string;
    const isAdmin = isAuthenticated && (role === 'admin' || role === 'superadmin');

    const [tab, setTab] = useState<Kind>('dealers');
    const [status, setStatus] = useState<Status>('pending');
    const [page, setPage] = useState(1);
    /** Keyed `${kind}:${id}` — the typed-but-unsaved percent for one row. */
    const [commission, setCommission] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<Row | null>(null);
    const [reason, setReason] = useState('');

    const listArgs = { status, page, limit: LIMIT };
    const dealers = useGetDealersQuery(listArgs, { skip: !isAdmin || tab !== 'dealers' });
    const companies = useGetCompaniesQuery(listArgs, { skip: !isAdmin || tab !== 'companies' });
    const retailers = useGetRetailersQuery(listArgs, { skip: !isAdmin || tab !== 'retailers' });
    const officers = useGetMarketingOfficersQuery(listArgs, { skip: !isAdmin || tab !== 'officers' });

    // The tab badges. `limit: 1` because only `meta.total` is read.
    const countArgs = { status: 'pending', limit: 1 };
    const dealerCount = useGetDealersQuery(countArgs, { skip: !isAdmin });
    const companyCount = useGetCompaniesQuery(countArgs, { skip: !isAdmin });
    const retailerCount = useGetRetailersQuery(countArgs, { skip: !isAdmin });
    const officerCount = useGetMarketingOfficersQuery(countArgs, { skip: !isAdmin });

    const [approveDealer] = useApproveDealerMutation();
    const [rejectDealer] = useRejectDealerMutation();
    const [suspendDealer] = useSuspendDealerMutation();
    const [updateDealer] = useUpdateDealerMutation();

    const [approveCompany] = useApproveCompanyMutation();
    const [rejectCompany] = useRejectCompanyMutation();
    const [suspendCompany] = useSuspendCompanyMutation();
    const [updateCompany] = useUpdateCompanyMutation();

    const [approveRetailer] = useApproveRetailerMutation();
    const [rejectRetailer] = useRejectRetailerMutation();
    const [suspendRetailer] = useSuspendRetailerMutation();

    const [approveOfficer] = useApproveMarketingOfficerMutation();
    const [rejectOfficer] = useRejectMarketingOfficerMutation();
    const [suspendOfficer] = useSuspendMarketingOfficerMutation();

    // The four hooks share a shape but not a type; one `any` here beats casting
    // every field read below.
    const active: any = tab === 'dealers' ? dealers : tab === 'companies' ? companies : tab === 'retailers' ? retailers : officers;
    const raw: any[] = Array.isArray(active.data?.data) ? active.data.data : [];
    const meta = active.data?.meta || { total: 0, totalPages: 1 };
    const totalPages = Math.max(Number(meta.totalPages) || 1, 1);
    const loadError = (active.error as any)?.data?.message;

    const rows = useMemo(() => raw.map((d) => normalise(tab, d)), [raw, tab]);

    const pendingCounts: Record<Kind, number> = {
        dealers: Number((dealerCount.data as any)?.meta?.total ?? 0),
        companies: Number((companyCount.data as any)?.meta?.total ?? 0),
        retailers: Number((retailerCount.data as any)?.meta?.total ?? 0),
        officers: Number((officerCount.data as any)?.meta?.total ?? 0),
    };

    const tabConfig = TABS.find((t) => t.id === tab)!;
    const showCommission = tabConfig.hasCommission;

    if (!isAdmin) return <RoleGate />;

    const switchTab = (next: Kind) => {
        setTab(next);
        setPage(1);
        setCommission({});
    };

    /** Parse the typed percent, or undefined when it is blank / out of range. */
    const draftRate = (row: Row): number | undefined => {
        const typed = commission[`${tab}:${row.id}`];
        if (typed === undefined || typed.trim() === '') return undefined;
        const n = Number(typed);
        if (!Number.isFinite(n) || n < 0 || n > 100) return undefined;
        return n;
    };

    const fail = (err: any, fallback: string) => {
        toast.error(err?.data?.message || err?.error || fallback);
    };

    const handleApprove = async (row: Row) => {
        setBusy(`${row.id}:approve`);
        try {
            if (tab === 'dealers') {
                const rate = draftRate(row);
                await approveDealer(rate === undefined ? row.id : { id: row.id, commissionRate: rate }).unwrap();
            } else if (tab === 'companies') {
                await approveCompany(row.id).unwrap();
            } else if (tab === 'retailers') {
                await approveRetailer(row.id).unwrap();
            } else {
                await approveOfficer(row.id).unwrap();
            }
            setCommission((prev) => {
                const next = { ...prev };
                delete next[`${tab}:${row.id}`];
                return next;
            });
            toast.success(`${row.title} approved`, {
                style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' },
            });
        } catch (err: any) {
            // One approved dealer per upazila. A bare "conflict" tells the owner
            // nothing, so name the area and the way out of it.
            if (tab === 'dealers' && err?.status === 409) {
                const where = row.upazila ? `${row.upazila} upazila` : 'This upazila';
                toast.error(
                    `${where} already has an approved dealer. Suspend or reject the current one before approving ${row.title}.`,
                    { duration: 7000 }
                );
            } else {
                fail(err, 'Could not approve this application');
            }
        } finally {
            setBusy(null);
        }
    };

    const handleSuspend = async (row: Row) => {
        setBusy(`${row.id}:suspend`);
        try {
            if (tab === 'dealers') await suspendDealer(row.id).unwrap();
            else if (tab === 'companies') await suspendCompany(row.id).unwrap();
            else if (tab === 'retailers') await suspendRetailer(row.id).unwrap();
            else await suspendOfficer(row.id).unwrap();
            toast.success(`${row.title} suspended`);
        } catch (err: any) {
            fail(err, 'Could not suspend this partner');
        } finally {
            setBusy(null);
        }
    };

    const submitReject = async () => {
        const row = rejecting;
        const text = reason.trim();
        if (!row) return;
        // The API answers 400 on an empty reason — stop it here instead.
        if (!text) {
            toast.error('Write a reason — the applicant is told why.');
            return;
        }
        setBusy(`${row.id}:reject`);
        try {
            const payload = { id: row.id, rejectionReason: text };
            if (tab === 'dealers') await rejectDealer(payload).unwrap();
            else if (tab === 'companies') await rejectCompany(payload).unwrap();
            else if (tab === 'retailers') await rejectRetailer(payload).unwrap();
            else await rejectOfficer(payload).unwrap();
            toast.success(`${row.title} rejected`);
            setRejecting(null);
            setReason('');
        } catch (err: any) {
            fail(err, 'Could not reject this application');
        } finally {
            setBusy(null);
        }
    };

    const saveCommission = async (row: Row) => {
        const rate = draftRate(row);
        if (rate === undefined) {
            toast.error('Commission must be a number between 0 and 100');
            return;
        }
        setBusy(`${row.id}:commission`);
        try {
            if (tab === 'dealers') await updateDealer({ id: row.id, data: { commissionRate: rate } }).unwrap();
            else await updateCompany({ id: row.id, data: { commissionRate: rate } }).unwrap();
            setCommission((prev) => {
                const next = { ...prev };
                delete next[`${tab}:${row.id}`];
                return next;
            });
            toast.success(`${row.title} commission set to ${rate}%`, {
                style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' },
            });
        } catch (err: any) {
            fail(err, 'Could not save the commission');
        } finally {
            setBusy(null);
        }
    };

    const openReject = (row: Row) => {
        setRejecting(row);
        setReason('');
    };

    // ── Row-level controls ──────────────────────────────────
    // Plain render helpers, not components: a component declared inside the page
    // gets a fresh identity every render, which would remount the percent input
    // and steal focus on each keystroke.

    const renderCommission = (row: Row) => {
        const key = `${tab}:${row.id}`;
        const typed = commission[key];
        const value = typed !== undefined ? typed : String(row.commissionRate ?? 0);
        const dirty = typed !== undefined && Number(typed) !== Number(row.commissionRate ?? 0);
        const valid = draftRate(row) !== undefined;
        const saving = busy === `${row.id}:commission`;

        return (
            <div className="flex items-center gap-1.5">
                <div className="relative">
                    <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step={0.5}
                        aria-label={`Commission percent for ${row.title}`}
                        value={value}
                        onChange={(e) => setCommission((prev) => ({ ...prev, [key]: e.target.value }))}
                        className={`w-[86px] min-h-[44px] pl-3 pr-7 py-2 rounded-lg border text-sm font-semibold text-gray-800 outline-none transition-colors ${
                            dirty && !valid ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-[var(--color-primary)]'
                        }`}
                    />
                    <LuPercent size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {dirty && (
                    <button
                        onClick={() => saveCommission(row)}
                        disabled={saving || !valid}
                        title={valid ? 'Save commission' : 'Enter a percent between 0 and 100'}
                        className="min-h-[44px] px-3 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {saving ? <LuLoaderCircle size={14} className="animate-spin" /> : 'Save'}
                    </button>
                )}
            </div>
        );
    };

    const renderActions = (row: Row) => {
        const approving = busy === `${row.id}:approve`;
        const suspending = busy === `${row.id}:suspend`;
        const canApprove = row.status !== 'approved';
        const canSuspend = row.status === 'approved';
        const canReject = row.status !== 'rejected';

        return (
            <div className="flex flex-wrap items-center gap-2">
                {canApprove && (
                    <button
                        onClick={() => handleApprove(row)}
                        disabled={approving}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-60 transition-all"
                    >
                        {approving ? <LuLoaderCircle size={14} className="animate-spin" /> : <LuCheck size={14} />}
                        Approve
                    </button>
                )}
                {canReject && (
                    <button
                        onClick={() => openReject(row)}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all"
                    >
                        <LuX size={14} /> Reject
                    </button>
                )}
                {canSuspend && (
                    <button
                        onClick={() => handleSuspend(row)}
                        disabled={suspending}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 rounded-lg bg-white border border-orange-200 text-orange-600 text-xs font-bold hover:bg-orange-50 disabled:opacity-60 transition-all"
                    >
                        {suspending ? <LuLoaderCircle size={14} className="animate-spin" /> : <LuBan size={14} />}
                        Suspend
                    </button>
                )}
                {!canApprove && !canSuspend && !canReject && (
                    <span className="text-xs text-gray-400 italic">No action left</span>
                )}
            </div>
        );
    };

    const columns = showCommission ? 7 : 6;

    const emptyCopy =
        status === 'pending'
            ? `No ${tabConfig.short.toLowerCase()} are waiting on you right now.`
            : `No ${status} ${tabConfig.short.toLowerCase()} yet.`;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Partner approvals</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Vet the documents, set the commission, then let them trade.
                    </p>
                </div>
                <button
                    onClick={() => active.refetch()}
                    className="self-start sm:self-auto min-h-[44px] px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 transition-all"
                >
                    <LuRefreshCw size={15} className={active.isFetching ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {TABS.map((t) => {
                        const count = pendingCounts[t.id];
                        const on = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => switchTab(t.id)}
                                className={`relative flex items-center justify-center gap-2 min-h-[48px] px-3 rounded-xl text-[13px] font-bold transition-all ${
                                    on
                                        ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                            >
                                <t.icon size={16} className="shrink-0" />
                                <span className="hidden sm:inline truncate">{t.label}</span>
                                <span className="sm:hidden truncate">{t.short}</span>
                                {count > 0 && (
                                    <span
                                        title={`${count} pending`}
                                        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold ${
                                            on ? 'bg-white text-[var(--color-primary)]' : 'bg-amber-500 text-white'
                                        }`}
                                    >
                                        {count > 99 ? '99+' : count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Status filter */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mr-1">Status</span>
                {STATUSES.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => { setStatus(s.id); setPage(1); }}
                        className={`min-h-[40px] px-3.5 rounded-lg text-[13px] font-semibold transition-all ${
                            status === s.id
                                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
                <span className="ml-auto text-xs text-gray-400 font-medium">
                    {active.isLoading ? 'Loading…' : `${Number(meta.total) || 0} ${tabConfig.short.toLowerCase()}`}
                </span>
            </div>

            {loadError && !active.isLoading && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <LuTriangleAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Cannot load this list</p>
                        <p className="text-xs text-amber-700 mt-0.5">{loadError}</p>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Applicant</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Account holder</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Area</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Documents</th>
                                {showCommission && (
                                    <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Commission</th>
                                )}
                                <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Applied</th>
                                <th className="px-5 py-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {active.isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(columns)].map((__, j) => (
                                            <td key={j} className="px-5 py-5">
                                                <div className="h-4 bg-gray-100 rounded w-24" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns} className="px-6 py-16 text-center">
                                        <LuInbox size={44} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-sm font-bold text-gray-600">Inbox clear</p>
                                        <p className="text-xs text-gray-400 mt-1">{emptyCopy}</p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors align-top">
                                        <td className="px-5 py-5">
                                            <p className="text-sm font-bold text-gray-900">{row.title}</p>
                                            {row.subtitle && (
                                                <p className="text-[11px] text-gray-400 mt-0.5 max-w-[220px]">{row.subtitle}</p>
                                            )}
                                            <div className="mt-1.5"><StatusPill status={row.status} /></div>
                                            {row.status === 'rejected' && row.rejectionReason && (
                                                <p className="text-[11px] text-red-500 mt-1.5 max-w-[220px] italic">
                                                    {row.rejectionReason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-5 max-w-[200px]"><HolderCell row={row} /></td>
                                        <td className="px-5 py-5 max-w-[180px]"><AreaCell row={row} /></td>
                                        <td className="px-5 py-5"><DocChips docs={row.docs} /></td>
                                        {showCommission && (
                                            <td className="px-5 py-5">{renderCommission(row)}</td>
                                        )}
                                        <td className="px-5 py-5">
                                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                                                <LuCalendar size={12} className="text-gray-300" />
                                                {formatDate(row.appliedAt)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5">
                                            <div className="flex justify-end">{renderActions(row)}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile / tablet cards */}
                <div className="lg:hidden divide-y divide-gray-100">
                    {active.isLoading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="p-4 animate-pulse space-y-3">
                                <div className="h-5 bg-gray-100 rounded w-2/3" />
                                <div className="h-14 bg-gray-50 rounded-xl" />
                                <div className="h-11 bg-gray-100 rounded-xl" />
                            </div>
                        ))
                    ) : rows.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <LuInbox size={40} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-sm font-bold text-gray-600">Inbox clear</p>
                            <p className="text-xs text-gray-400 mt-1">{emptyCopy}</p>
                        </div>
                    ) : (
                        rows.map((row) => (
                            <div key={row.id} className="p-4 space-y-3.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[15px] font-bold text-gray-900 break-words">{row.title}</p>
                                        {row.subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{row.subtitle}</p>}
                                    </div>
                                    <StatusPill status={row.status} />
                                </div>

                                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <LuUserCheck size={14} className="text-gray-300 shrink-0 mt-1" />
                                        <HolderCell row={row} />
                                    </div>
                                    <div className="pt-3 border-t border-gray-100">
                                        <AreaCell row={row} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                                        <LuIdCard size={12} /> Documents
                                    </p>
                                    <DocChips docs={row.docs} />
                                </div>

                                {showCommission && (
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                                            <LuPercent size={12} /> Commission
                                        </p>
                                        {renderCommission(row)}
                                    </div>
                                )}

                                {row.status === 'rejected' && row.rejectionReason && (
                                    <p className="text-[11px] text-red-500 italic">Reason: {row.rejectionReason}</p>
                                )}

                                <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
                                        <LuCalendar size={12} /> Applied {formatDate(row.appliedAt)}
                                    </span>
                                    {renderActions(row)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/40">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all"
                        >
                            <LuChevronLeft size={16} /> Prev
                        </button>
                        <span className="text-sm font-bold text-gray-500">Page {page} of {totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all"
                        >
                            Next <LuChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Reject modal — the API refuses an empty reason, so this is required */}
            {rejecting && (
                <div
                    className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
                    onClick={() => { if (!busy) { setRejecting(null); setReason(''); } }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Reject ${rejecting.title}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-5 sm:p-6 space-y-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Reject this application</h2>
                                <p className="text-sm text-gray-400 mt-0.5">{rejecting.title}</p>
                            </div>
                            <button
                                onClick={() => { setRejecting(null); setReason(''); }}
                                aria-label="Close"
                                className="w-11 h-11 -mr-2 -mt-1 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <LuX size={18} />
                            </button>
                        </div>

                        <div>
                            <label htmlFor="reject-reason" className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="reject-reason"
                                rows={4}
                                autoFocus
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. The trade licence photo is unreadable — re-upload a clear scan and apply again."
                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                The applicant sees this on their dashboard, so say what to fix.
                            </p>
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                onClick={() => { setRejecting(null); setReason(''); }}
                                className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReject}
                                disabled={!reason.trim() || busy === `${rejecting.id}:reject`}
                                className="flex-1 min-h-[44px] rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
                            >
                                {busy === `${rejecting.id}:reject`
                                    ? <LuLoaderCircle size={16} className="animate-spin" />
                                    : <LuX size={16} />}
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
