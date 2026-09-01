"use client";

/**
 * Admin-side "create a partner" modal.
 *
 * Unlike the apply → approve inbox, this lets the owner spin up a Company or
 * Dealer directly. Because a partner is a login account plus a business profile,
 * the form collects both: the owner's credentials (which become their sign-in)
 * and the business details. The server creates the account, marks the profile
 * approved, and — for dealers — enforces the one-per-upazila rule.
 */

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { LuX, LuLoaderCircle, LuUserPlus, LuStore, LuBuilding2 } from 'react-icons/lu';
import { useAdminCreateCompanyMutation } from '@/redux/api/companyApi';
import { useAdminCreateDealerMutation } from '@/redux/api/dealerApi';
import AreaSelect, { AreaValue } from '@/components/shared/AreaSelect';

type Kind = 'dealers' | 'companies';

const inputCls =
    'w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 bg-white outline-none ' +
    'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)] transition-colors';

/**
 * Ask browser password managers / autofill to leave these fields alone. Those
 * extensions inject their own icons into the inputs, mutating the DOM under
 * React — which then crashes on its next render with a removeChild/insertBefore
 * error. These attributes cover the common managers (LastPass, 1Password,
 * Bitwarden, Dashlane) plus generic autofill.
 */
const ignoreAutofill = {
    autoComplete: 'off',
    'data-lpignore': 'true',
    'data-1p-ignore': 'true',
    'data-bwignore': 'true',
    'data-form-type': 'other',
} as const;

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

export default function CreatePartnerModal({
    kind,
    onClose,
    onCreated,
}: {
    kind: Kind;
    onClose: () => void;
    onCreated: () => void;
}) {
    const isDealer = kind === 'dealers';
    const noun = isDealer ? 'Dealer' : 'Company';

    const [form, setForm] = useState({
        ownerFirstName: '', ownerLastName: '', ownerEmail: '', ownerPhone: '', ownerPassword: '',
        name: '', phone: '', address: '', whatsapp: '', commissionRate: '',
    });
    const [area, setArea] = useState<AreaValue>({});
    const [level, setLevel] = useState<'upazila' | 'district'>('upazila');

    const [createCompany, { isLoading: creatingCompany }] = useAdminCreateCompanyMutation();
    const [createDealer, { isLoading: creatingDealer }] = useAdminCreateDealerMutation();
    const submitting = creatingCompany || creatingDealer;

    const set = (k: keyof typeof form, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.ownerFirstName.trim() || !form.ownerEmail.trim() || !form.ownerPassword) {
            toast.error('Owner name, email and password are required');
            return;
        }
        if (form.ownerPassword.length < 6) {
            toast.error('Owner password must be at least 6 characters');
            return;
        }
        if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
            toast.error(`${noun} name, phone and address are required`);
            return;
        }
        if (isDealer) {
            if (level === 'district' && !area.district) {
                toast.error("Select the dealer's district");
                return;
            }
            if (level === 'upazila' && !area.upazila) {
                toast.error("Select the dealer's upazila");
                return;
            }
        }
        const rateStr = form.commissionRate.trim();
        const rate = rateStr === '' ? undefined : Number(rateStr);
        if (rate !== undefined && (!Number.isFinite(rate) || rate < 0 || rate > 100)) {
            toast.error('Commission must be a number between 0 and 100');
            return;
        }

        const body: Record<string, unknown> = {
            ownerFirstName: form.ownerFirstName.trim(),
            ownerLastName: form.ownerLastName.trim(),
            ownerEmail: form.ownerEmail.trim(),
            ownerPhone: form.ownerPhone.trim(),
            ownerPassword: form.ownerPassword,
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            ...(form.whatsapp.trim() ? { whatsapp: form.whatsapp.trim() } : {}),
            ...(rate !== undefined ? { commissionRate: rate } : {}),
        };

        try {
            if (isDealer) {
                await createDealer({
                    ...body,
                    level,
                    ...(level === 'district' ? { district: area.district } : { upazila: area.upazila }),
                }).unwrap();
            } else {
                await createCompany(body).unwrap();
            }
            toast.success(`${form.name.trim()} created`, {
                style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' },
            });
            onCreated();
            onClose();
        } catch (err: any) {
            toast.error(err?.data?.message || err?.error || `Could not create this ${noun.toLowerCase()}`);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => { if (!submitting) onClose(); }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={`Create ${noun}`}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                            {isDealer ? <LuStore size={18} /> : <LuBuilding2 size={18} />}
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">Add {noun}</h2>
                            <p className="text-[11px] text-gray-400">Creates a login account + an approved profile.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <LuX size={18} />
                    </button>
                </div>

                <form onSubmit={submit} autoComplete="off" className="px-5 sm:px-6 py-5 space-y-5">
                    {/* Owner account */}
                    <div className="space-y-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                            <LuUserPlus size={13} /> Owner login account
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="First name" required>
                                <input {...ignoreAutofill} className={inputCls} value={form.ownerFirstName} onChange={(e) => set('ownerFirstName', e.target.value)} placeholder="e.g. Karim" />
                            </Field>
                            <Field label="Last name">
                                <input {...ignoreAutofill} className={inputCls} value={form.ownerLastName} onChange={(e) => set('ownerLastName', e.target.value)} placeholder="e.g. Uddin" />
                            </Field>
                        </div>
                        <Field label="Email (login)" required>
                            <input type="email" {...ignoreAutofill} className={inputCls} value={form.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} placeholder="owner@example.com" />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Owner phone">
                                <input {...ignoreAutofill} className={inputCls} value={form.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} placeholder="01XXXXXXXXX" />
                            </Field>
                            <Field label="Password" required>
                                <input type="text" {...ignoreAutofill} className={inputCls} value={form.ownerPassword} onChange={(e) => set('ownerPassword', e.target.value)} placeholder="Min 6 characters" />
                            </Field>
                        </div>
                    </div>

                    {/* Business details */}
                    <div className="space-y-3 pt-1">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                            {isDealer ? <LuStore size={13} /> : <LuBuilding2 size={13} />} {noun} details
                        </p>
                        <Field label={`${noun} name`} required>
                            <input {...ignoreAutofill} className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={isDealer ? 'e.g. Karim Distribution' : 'e.g. ACME Traders'} />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Business phone" required>
                                <input {...ignoreAutofill} className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01XXXXXXXXX" />
                            </Field>
                            <Field label="WhatsApp">
                                <input {...ignoreAutofill} className={inputCls} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="Optional" />
                            </Field>
                        </div>
                        <Field label="Address" required>
                            <input {...ignoreAutofill} className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, area" />
                        </Field>

                        {isDealer && (
                            <div className="space-y-2.5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        Dealer type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['upazila', 'district'] as const).map((lv) => (
                                            <button
                                                key={lv}
                                                type="button"
                                                onClick={() => { setLevel(lv); setArea({}); }}
                                                className={`px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${level === lv
                                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/[0.08] text-[var(--color-primary)]'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {lv === 'upazila' ? 'Upazila dealer' : 'District dealer'}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1.5">
                                        {level === 'district'
                                            ? 'Covers a whole district — the fallback for upazilas that have no dealer of their own.'
                                            : 'Covers one upazila. Orders placed in that upazila go to this dealer.'}
                                    </p>
                                </div>
                                <AreaSelect
                                    label={level === 'district' ? 'Territory (division → district)' : 'Territory (division → district → upazila)'}
                                    required
                                    value={area}
                                    onChange={setArea}
                                />
                            </div>
                        )}

                        <Field label="Commission %">
                            <input
                                type="number" min={0} max={100} step={0.5}
                                {...ignoreAutofill}
                                className={`${inputCls} max-w-[140px]`}
                                value={form.commissionRate}
                                onChange={(e) => set('commissionRate', e.target.value)}
                                placeholder="0"
                            />
                        </Field>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 min-h-[46px] rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 min-h-[46px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
                        >
                            {submitting ? <LuLoaderCircle size={16} className="animate-spin" /> : <LuUserPlus size={16} />}
                            Create {noun}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
