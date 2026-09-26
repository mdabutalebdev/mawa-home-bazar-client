"use client";

/**
 * Single-partner details page.
 *
 * Opened from a row on the Partner-approvals list. Shows the full record for one
 * dealer / company / retailer in a clean, centered, form-style layout, and is the
 * control centre for that partner: approve / reject / suspend, set the
 * commission, and manage the login credentials (change email / reset password).
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
    LuArrowLeft, LuMail, LuPhone, LuMapPin, LuPercent, LuCalendar, LuFileText,
    LuUserCheck, LuKeyRound, LuLoaderCircle, LuEye, LuEyeOff, LuShieldCheck,
    LuTriangleAlert, LuSave, LuCheck, LuX, LuBan, LuBuilding2, LuHandshake, LuStore,
    LuCopy, LuSparkles,
} from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import {
    useGetDealerByIdQuery, useApproveDealerMutation, useRejectDealerMutation,
    useSuspendDealerMutation, useUpdateDealerMutation,
} from '@/redux/api/dealerApi';
import {
    useGetCompanyByIdQuery, useApproveCompanyMutation, useRejectCompanyMutation,
    useSuspendCompanyMutation, useUpdateCompanyMutation,
} from '@/redux/api/companyApi';
import {
    useGetRetailerByIdQuery, useApproveRetailerMutation, useRejectRetailerMutation,
    useSuspendRetailerMutation,
} from '@/redux/api/retailerApi';
import { useAdminUpdateCredentialsMutation, useGetAdminUserCredentialsQuery } from '@/redux/api/userApi';
import {
    Kind, KIND_LABEL, STATUS_PILL, KIND_HAS_COMMISSION,
    imgSrc, formatDate, normalisePartner,
} from '@/lib/partners';

const KIND_ICON: Record<Kind, React.ElementType> = {
    dealers: LuHandshake,
    companies: LuBuilding2,
    retailers: LuStore,
};

/* One labelled read-only field */
const Field = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
            {icon}
        </span>
        <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
            <div className="text-sm font-semibold text-gray-800 break-words mt-0.5">{children}</div>
        </div>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4">{children}</h2>
);

export default function PartnerDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const rawKind = (Array.isArray(params?.kind) ? params.kind[0] : params?.kind) as string;
    const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;
    const kind = (['dealers', 'companies', 'retailers'].includes(rawKind) ? rawKind : '') as Kind | '';

    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const isAdmin = isAuthenticated && (user?.role || '') === 'admin';

    // Fetch the one record — only the hook for the active kind runs.
    const dealer = useGetDealerByIdQuery(id, { skip: !isAdmin || kind !== 'dealers' || !id });
    const company = useGetCompanyByIdQuery(id, { skip: !isAdmin || kind !== 'companies' || !id });
    const retailer = useGetRetailerByIdQuery(id, { skip: !isAdmin || kind !== 'retailers' || !id });
    const active: any = kind === 'dealers' ? dealer : kind === 'companies' ? company : retailer;
    const doc = active?.data?.data || active?.data || null;

    const row = useMemo(() => (kind && doc?._id ? normalisePartner(kind, doc) : null), [kind, doc]);

    // Mutations
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
    const [updateCredentials, { isLoading: savingCreds }] = useAdminUpdateCredentialsMutation();

    // The linked account's login id — resolved once the record loads.
    const partnerUserId = row?.userId || '';
    const { data: credsData } = useGetAdminUserCredentialsQuery(partnerUserId, { skip: !partnerUserId });
    const savedPassword = credsData?.data?.visiblePassword || '';

    // Local state
    const [busy, setBusy] = useState<string | null>(null);
    const [commissionInput, setCommissionInput] = useState('');
    const [showReject, setShowReject] = useState(false);
    const [reason, setReason] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    // Seed the editable fields once the record loads.
    useEffect(() => {
        if (row) {
            setCommissionInput(row.commissionRate !== null ? String(row.commissionRate) : '');
            setEmail(row.email || '');
        }
    }, [row?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Show the stored (admin-visible) password in the field once it arrives, and
    // again after a save (the refetched value is what was just saved).
    useEffect(() => {
        setPassword(savedPassword);
    }, [savedPassword]);

    const hasCommission = kind ? KIND_HAS_COMMISSION[kind] : false;
    const KindIcon = kind ? KIND_ICON[kind] : LuHandshake;

    const fail = (err: any, fallback: string) => toast.error(err?.data?.message || err?.error || fallback);
    const ok = (msg: string) => toast.success(msg, { style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' } });

    if (!isAdmin) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
                    <LuShieldCheck size={26} />
                </div>
                <h1 className="text-lg font-bold text-gray-900">Owner access only</h1>
                <p className="text-sm text-gray-500 mt-2">Sign in with an admin account to view partner details.</p>
            </div>
        );
    }

    if (!kind) {
        return <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">Unknown partner type.</div>;
    }

    if (active.isLoading) {
        return (
            <div className="max-w-3xl mx-auto space-y-4">
                <div className="h-10 w-40 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-40 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                <div className="h-64 bg-white border border-gray-100 rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (!row) {
        return (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <LuTriangleAlert size={32} className="mx-auto text-amber-500 mb-3" />
                <h1 className="text-lg font-bold text-gray-900">Partner not found</h1>
                <p className="text-sm text-gray-500 mt-1">This {KIND_LABEL[kind].toLowerCase()} may have been removed.</p>
                <Link href="/dashboard/admin/partners" className="inline-flex items-center gap-2 mt-5 min-h-[44px] px-5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
                    <LuArrowLeft size={16} /> Back to partners
                </Link>
            </div>
        );
    }

    const draftRate = (): number | undefined => {
        if (commissionInput.trim() === '') return undefined;
        const n = Number(commissionInput);
        if (!Number.isFinite(n) || n < 0 || n > 100) return undefined;
        return n;
    };

    const handleApprove = async () => {
        setBusy('approve');
        try {
            if (kind === 'dealers') {
                const rate = draftRate();
                await approveDealer(rate === undefined ? row.id : { id: row.id, commissionRate: rate }).unwrap();
            } else if (kind === 'companies') {
                await approveCompany(row.id).unwrap();
            } else {
                await approveRetailer(row.id).unwrap();
            }
            ok(`${row.title} approved`);
            active.refetch();
        } catch (err: any) {
            if (kind === 'dealers' && err?.status === 409) {
                const where = row.upazila ? `${row.upazila} upazila` : 'This upazila';
                toast.error(`${where} already has an approved dealer. Suspend or reject the current one first.`, { duration: 7000 });
            } else fail(err, 'Could not approve this application');
        } finally { setBusy(null); }
    };

    const handleSuspend = async () => {
        setBusy('suspend');
        try {
            if (kind === 'dealers') await suspendDealer(row.id).unwrap();
            else if (kind === 'companies') await suspendCompany(row.id).unwrap();
            else await suspendRetailer(row.id).unwrap();
            ok(`${row.title} suspended`);
            active.refetch();
        } catch (err: any) { fail(err, 'Could not suspend this partner'); }
        finally { setBusy(null); }
    };

    const submitReject = async () => {
        const text = reason.trim();
        if (!text) { toast.error('Write a reason — the applicant is told why.'); return; }
        setBusy('reject');
        try {
            const payload = { id: row.id, rejectionReason: text };
            if (kind === 'dealers') await rejectDealer(payload).unwrap();
            else if (kind === 'companies') await rejectCompany(payload).unwrap();
            else await rejectRetailer(payload).unwrap();
            ok(`${row.title} rejected`);
            setShowReject(false);
            setReason('');
            active.refetch();
        } catch (err: any) { fail(err, 'Could not reject this application'); }
        finally { setBusy(null); }
    };

    const saveCommission = async () => {
        const rate = draftRate();
        if (rate === undefined) { toast.error('Commission must be a number between 0 and 100'); return; }
        setBusy('commission');
        try {
            if (kind === 'dealers') await updateDealer({ id: row.id, data: { commissionRate: rate } }).unwrap();
            else await updateCompany({ id: row.id, data: { commissionRate: rate } }).unwrap();
            ok(`Commission set to ${rate}%`);
            active.refetch();
        } catch (err: any) { fail(err, 'Could not save the commission'); }
        finally { setBusy(null); }
    };

    const emailChanged = email.trim().toLowerCase() !== (row.email || '').trim().toLowerCase();
    // The field is pre-filled with the stored password, so "changed" means the
    // admin actually typed/generated something different (and non-empty).
    const passwordChanged = password.length > 0 && password !== savedPassword;
    const canSaveCreds = !!row.userId && (emailChanged || passwordChanged);

    // Build a strong, readable password the admin can save then share with the partner.
    const generatePassword = () => {
        const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lower = 'abcdefghijkmnpqrstuvwxyz';
        const digits = '23456789';
        const symbols = '@#$%&*';
        const all = upper + lower + digits + symbols;
        const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
        let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
        for (let i = 0; i < 6; i++) pwd += pick(all);
        pwd = pwd.split('').sort(() => Math.random() - 0.5).join('');
        setPassword(pwd);
        setShowPass(true);
        toast.success('Password generated — copy it, then Save to apply');
    };

    const copyText = async (text: string, label: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch {
            toast.error('Could not copy — select and copy manually');
        }
    };

    const handleSaveCredentials = async () => {
        if (!row.userId) { toast.error('This partner has no linked login account.'); return; }
        if (!emailChanged && !passwordChanged) return;
        if (emailChanged && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error('Enter a valid email address'); return; }
        if (passwordChanged && password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        const body: any = { id: row.userId };
        if (emailChanged) body.email = email.trim();
        if (passwordChanged) body.password = password;
        try {
            await updateCredentials(body).unwrap();
            ok('Login credentials saved');
            // Keep the password shown — the refetched stored copy re-seeds the field.
            active.refetch();
        } catch (err: any) { fail(err, 'Could not update credentials'); }
    };

    const present = row.docs.filter((d) => d.number || d.image);
    const canApprove = row.status !== 'approved';
    const canSuspend = row.status === 'approved';
    const canReject = row.status !== 'rejected';

    return (
        <div className="max-w-3xl mx-auto space-y-4 pb-10">
            {/* Back */}
            <Link
                href="/dashboard/admin/partners"
                className="inline-flex items-center gap-2 min-h-[40px] text-sm font-semibold text-gray-500 hover:text-[var(--color-primary)] transition-colors"
            >
                <LuArrowLeft size={17} /> Back to partners
            </Link>

            {/* Identity header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <span className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] shrink-0">
                        <KindIcon size={26} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wide">{KIND_LABEL[kind]}</p>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words leading-tight">{row.title}</h1>
                        {row.subtitle && <p className="text-sm text-gray-400 mt-0.5">{row.subtitle}</p>}
                        <span className={`inline-flex items-center mt-2.5 px-3 py-1 rounded-full border text-[11px] font-bold capitalize ${STATUS_PILL[row.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {row.status || 'unknown'}
                        </span>
                    </div>
                </div>
                {row.status === 'rejected' && row.rejectionReason && (
                    <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-3 flex items-start gap-2">
                        <LuTriangleAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Rejection reason</p>
                            <p className="text-sm text-red-700 mt-0.5">{row.rejectionReason}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Account holder + record */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <SectionTitle>Account holder</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field icon={<LuUserCheck size={18} />} label="Name">{row.holderName || 'Unnamed account'}</Field>
                    <Field icon={<LuMail size={18} />} label="Email">
                        {row.email ? <a href={`mailto:${row.email}`} className="hover:text-[var(--color-primary)] break-all">{row.email}</a> : <span className="text-gray-400 font-normal italic">No email on file</span>}
                    </Field>
                    <Field icon={<LuPhone size={18} />} label="Phone">
                        {row.phone ? <a href={`tel:${row.phone.replace(/[^\d+]/g, '')}`} className="hover:text-[var(--color-primary)]">{row.phone}</a> : <span className="text-gray-400 font-normal italic">No phone on file</span>}
                    </Field>
                    <Field icon={<LuMapPin size={18} />} label="Area">
                        {row.upazila || row.district ? <>{row.upazila || '—'}{row.district ? `, ${row.district} district` : ''}</> : <span className="text-gray-400 font-normal italic">No area on file</span>}
                    </Field>
                    <Field icon={<LuCalendar size={18} />} label="Applied">{formatDate(row.appliedAt)}</Field>
                    {hasCommission && (
                        <Field icon={<LuPercent size={18} />} label="Commission">{row.commissionRate}%</Field>
                    )}
                </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <SectionTitle>Documents</SectionTitle>
                {present.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No documents uploaded</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {present.map((docItem) => {
                            const src = imgSrc(docItem.image);
                            return (
                                <div key={docItem.label} className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
                                    {src ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <a href={src} target="_blank" rel="noopener noreferrer" title={`Open ${docItem.label}`} className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0">
                                            <img src={src} alt={docItem.label} className="w-full h-full object-cover" />
                                        </a>
                                    ) : (
                                        <span className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-300 shrink-0">
                                            <LuFileText size={22} />
                                        </span>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{docItem.label}</p>
                                        <p className="text-sm font-semibold text-gray-800 font-mono break-all">
                                            {docItem.number || (src ? 'Image only' : '—')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Commission editor */}
            {hasCommission && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <SectionTitle>Commission</SectionTitle>
                    <div className="flex items-end gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Rate (%)</label>
                            <div className="relative">
                                <input
                                    type="number" min={0} max={100} step={0.5}
                                    value={commissionInput}
                                    onChange={(e) => setCommissionInput(e.target.value)}
                                    className="w-32 min-h-[44px] pl-3.5 pr-8 rounded-lg border border-gray-200 text-sm font-semibold text-gray-800 outline-none focus:border-[var(--color-primary)] transition-colors"
                                />
                                <LuPercent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <button
                            onClick={saveCommission}
                            disabled={busy === 'commission'}
                            className="min-h-[44px] px-5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-all inline-flex items-center gap-2"
                        >
                            {busy === 'commission' ? <LuLoaderCircle size={15} className="animate-spin" /> : <LuSave size={15} />}
                            Save
                        </button>
                    </div>
                </div>
            )}

            {/* Login credentials */}
            <div className="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.03] p-5 sm:p-6">
                <div className="flex items-center gap-2.5 mb-4">
                    <span className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                        <LuKeyRound size={18} />
                    </span>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Login credentials</p>
                        <p className="text-[12px] text-gray-500">View or change the partner&apos;s email &amp; password</p>
                    </div>
                </div>

                {!row.userId ? (
                    <p className="text-sm text-gray-500 italic">This partner has no linked login account.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Login email</label>
                                <div className="relative">
                                    <input
                                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="w-full min-h-[44px] pl-3.5 pr-11 rounded-lg border border-gray-200 text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white"
                                    />
                                    <button type="button" onClick={() => copyText(email, 'Email')} title="Copy email"
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-md text-gray-400 hover:text-[var(--color-primary)] hover:bg-gray-100 transition-colors">
                                        <LuCopy size={15} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[11px] font-bold text-gray-500">Password</label>
                                    <button type="button" onClick={generatePassword}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-primary)] hover:underline">
                                        <LuSparkles size={12} /> Generate
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                        placeholder={savedPassword ? '' : 'No password on file — type or Generate'} autoComplete="new-password"
                                        className="w-full min-h-[44px] pl-3.5 pr-[76px] rounded-lg border border-gray-200 text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white font-mono"
                                    />
                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                        {password && (
                                            <button type="button" onClick={() => copyText(password, 'Password')} title="Copy password"
                                                className="w-9 h-9 flex items-center justify-center rounded-md text-gray-400 hover:text-[var(--color-primary)] hover:bg-gray-100 transition-colors">
                                                <LuCopy size={15} />
                                            </button>
                                        )}
                                        <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'}
                                            className="w-9 h-9 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                            {showPass ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 p-3">
                            <LuShieldCheck size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[12px] text-amber-700 leading-relaxed">
                                Use the eye icon to reveal the partner&apos;s current password. To change it, type a new one (or tap <strong>Generate</strong>) and press <strong>Save</strong>. Older accounts created before this feature may show blank until you set a password once.
                            </p>
                        </div>

                        <button
                            onClick={handleSaveCredentials}
                            disabled={!canSaveCreds || savingCreds}
                            className="min-h-[44px] px-5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
                        >
                            {savingCreds ? <LuLoaderCircle size={15} className="animate-spin" /> : <LuSave size={15} />}
                            Save credentials
                        </button>
                    </div>
                )}
            </div>

            {/* Reject reason (inline) */}
            {showReject && (
                <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5 sm:p-6 space-y-3">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Rejection reason <span className="text-red-500">*</span></label>
                        <textarea
                            rows={3} autoFocus value={reason} onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. The trade licence photo is unreadable — re-upload a clear scan and apply again."
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-red-400 transition-colors resize-none"
                        />
                        <p className="text-[11px] text-gray-400 mt-1.5">The applicant sees this on their dashboard, so say what to fix.</p>
                    </div>
                    <div className="flex gap-2.5">
                        <button onClick={() => { setShowReject(false); setReason(''); }} className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
                        <button onClick={submitReject} disabled={!reason.trim() || busy === 'reject'}
                            className="flex-1 min-h-[44px] rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2">
                            {busy === 'reject' ? <LuLoaderCircle size={16} className="animate-spin" /> : <LuX size={16} />} Confirm reject
                        </button>
                    </div>
                </div>
            )}

            {/* Action bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-wrap items-center gap-2.5">
                {canApprove && (
                    <button onClick={handleApprove} disabled={busy === 'approve'}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[46px] px-5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-60 transition-all">
                        {busy === 'approve' ? <LuLoaderCircle size={16} className="animate-spin" /> : <LuCheck size={16} />} Approve
                    </button>
                )}
                {canReject && !showReject && (
                    <button onClick={() => setShowReject(true)}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[46px] px-5 rounded-xl bg-white border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-all">
                        <LuX size={16} /> Reject
                    </button>
                )}
                {canSuspend && (
                    <button onClick={handleSuspend} disabled={busy === 'suspend'}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[46px] px-5 rounded-xl bg-white border border-orange-200 text-orange-600 text-sm font-bold hover:bg-orange-50 disabled:opacity-60 transition-all">
                        {busy === 'suspend' ? <LuLoaderCircle size={16} className="animate-spin" /> : <LuBan size={16} />} Suspend
                    </button>
                )}
                <Link href="/dashboard/admin/partners" className="ml-auto inline-flex items-center gap-1.5 min-h-[46px] px-5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                    Done
                </Link>
            </div>
        </div>
    );
}
