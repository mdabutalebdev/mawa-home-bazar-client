"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    LuBuilding2, LuPhone, LuMail, LuGlobe, LuMapPin, LuFileText, LuUpload,
    LuX, LuLoader, LuImage, LuExternalLink, LuPackage, LuWrench, LuMessageCircle,
    LuCircleAlert, LuSave, LuPercent,
} from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '@/redux';
import { useGetMyCompanyQuery, useUpdateMyCompanyMutation } from '@/redux/api/companyApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useUploadMyImagesMutation } from '@/redux/api/uploadApi';
import AreaSelect, { AreaValue } from '@/components/shared/AreaSelect';

const inputCls =
    'w-full text-sm px-3.5 py-3 rounded-xl border border-gray-200 bg-white outline-none ' +
    'placeholder:text-gray-400 transition-colors focus:border-[var(--color-primary)] ' +
    'focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5';
const errCls = 'text-xs text-red-500 mt-1.5';

const BD_PHONE = /^01\d{9}$/;

interface Category { _id: string; name: string; parent?: string | null }

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
    banner: string;
};

const emptyForm: FormState = {
    name: '', type: 'product', description: '', about: '',
    phone: '', whatsapp: '', email: '', website: '', address: '',
    tradeLicense: '', tin: '', bin: '', logo: '', banner: '',
};

const idOf = (v: unknown): string =>
    (typeof v === 'object' && v !== null ? (v as { _id?: string })._id : (v as string)) || '';

const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-extrabold text-gray-900">{title}</h2>
        {subtitle && <p className="text-[12px] text-gray-500 mt-0.5 mb-3.5">{subtitle}</p>}
        <div className={subtitle ? '' : 'mt-3.5'}>{children}</div>
    </div>
);

export default function CompanyProfilePage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = user?.role as string | undefined;
    const isCompany = role === 'company';

    const { data: mineRes, isLoading } = useGetMyCompanyQuery(undefined, { skip: !isCompany });
    const { data: catRes } = useGetCategoriesQuery({ limit: 200 }, { skip: !isCompany });
    const [updateMyCompany, { isLoading: saving }] = useUpdateMyCompanyMutation();
    const [uploadImages, { isLoading: uploading }] = useUploadMyImagesMutation();

    const [form, setForm] = useState<FormState>(emptyForm);
    const [area, setArea] = useState<AreaValue>({});
    const [categories, setCategories] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadTarget, setUploadTarget] = useState<'logo' | 'banner' | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const company = mineRes?.data || null;
    const catList: Category[] = (catRes?.data || []).filter((c: Category) => !c.parent);

    // Fill the form from the saved profile once it lands.
    useEffect(() => {
        if (!company) return;
        setForm({
            name: company.name || '',
            type: company.type === 'service' ? 'service' : 'product',
            description: company.description || '',
            about: company.about || '',
            phone: company.phone || '',
            whatsapp: company.whatsapp || '',
            email: company.email || '',
            website: company.website || '',
            address: company.address || '',
            tradeLicense: company.tradeLicense || '',
            tin: company.tin || '',
            bin: company.bin || '',
            logo: company.logo || '',
            banner: company.banner || '',
        });
        setArea({
            division: idOf(company.division) || undefined,
            district: idOf(company.district) || undefined,
            upazila: idOf(company.upazila) || undefined,
        });
        setCategories((company.categories || []).map(idOf).filter(Boolean));
    }, [company]);

    if (!isAuthenticated || !isCompany) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.08)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                    <LuBuilding2 size={24} />
                </div>
                <h1 className="text-lg font-extrabold text-gray-900">Company account required</h1>
                <p className="text-sm text-gray-500 leading-relaxed mt-2">
                    Apply as a supplier first and this becomes your storefront settings page.
                </p>
                <Link
                    href="/join/company"
                    className="inline-flex items-center justify-center gap-2 w-full mt-5 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                    Apply as a company
                </Link>
            </div>
        );
    }

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
        setForm((f) => ({ ...f, [k]: v }));
        if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
    };

    const toggleCategory = (id: string) =>
        setCategories((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

    const pickImage = (target: 'logo' | 'banner') => {
        setUploadTarget(target);
        fileRef.current?.click();
    };

    /** /upload/my-images is the one upload route open to a non-admin account. */
    const handleFile = async (files: FileList | null) => {
        const file = files?.[0];
        const target = uploadTarget;
        if (fileRef.current) fileRef.current.value = '';
        setUploadTarget(null);
        if (!file || !target) return;
        if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }

        const fd = new FormData();
        fd.append('images', file);
        try {
            const res = await uploadImages(fd).unwrap();
            const url = res.data.urls?.[0];
            if (url) {
                set(target, url);
                toast.success(target === 'logo' ? 'Logo uploaded' : 'Banner uploaded');
            }
        } catch {
            toast.error('Upload failed. Try again.');
        }
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Company name is required';
        if (!form.phone.trim()) e.phone = 'A phone number is required';
        else if (!BD_PHONE.test(form.phone.trim())) e.phone = 'Use an 11-digit number starting 01';
        if (form.whatsapp.trim() && !BD_PHONE.test(form.whatsapp.trim())) {
            e.whatsapp = 'Use an 11-digit number starting 01';
        }
        if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'That email does not look right';
        if (!form.address.trim()) e.address = 'A head-office address is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await updateMyCompany({
                name: form.name.trim(),
                type: form.type,
                description: form.description.trim(),
                about: form.about.trim(),
                phone: form.phone.trim(),
                whatsapp: form.whatsapp.trim(),
                email: form.email.trim(),
                website: form.website.trim(),
                address: form.address.trim(),
                division: area.division || null,
                district: area.district || null,
                upazila: area.upazila || null,
                categories,
                tradeLicense: form.tradeLicense.trim(),
                tin: form.tin.trim(),
                bin: form.bin.trim(),
                logo: form.logo,
                banner: form.banner,
            }).unwrap();
            toast.success('Profile saved');
        } catch (err) {
            toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not save your profile');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
                        <div className="h-11 bg-gray-100 rounded-xl mb-3" />
                        <div className="h-11 bg-gray-100 rounded-xl" />
                    </div>
                ))}
            </div>
        );
    }

    if (!company) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                    <LuCircleAlert size={24} />
                </div>
                <h1 className="text-lg font-extrabold text-gray-900">No company profile found</h1>
                <p className="text-sm text-gray-500 leading-relaxed mt-2">
                    Your account has the company role but no application on file. Submit one and this page fills in.
                </p>
                <Link
                    href="/join/company"
                    className="inline-flex items-center justify-center gap-2 w-full mt-5 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                    Complete the application
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pb-24 sm:pb-4">

            {/* ── Header ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">Company profile</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        This is what buyers see on your public storefront.
                    </p>
                </div>
                {company.slug && (
                    <Link
                        href={`/companies/${company.slug}`}
                        className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl bg-gray-50 text-gray-700 text-[13px] font-bold hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                        <LuExternalLink size={15} /> View storefront
                    </Link>
                )}
            </div>

            {/* Read-only facts the owner controls. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                    <LuPercent size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Commission rate</p>
                        <p className="text-sm font-extrabold text-gray-900 mt-0.5">{Number(company.commissionRate ?? 0)}%</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                    <LuGlobe size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Storefront URL</p>
                        <p className="text-sm font-extrabold text-gray-900 mt-0.5 truncate">/companies/{company.slug}</p>
                    </div>
                </div>
            </div>

            {/* ── Branding ── */}
            <Section title="Logo & banner" subtitle="A clear logo and a wide banner make your storefront look like a real shop.">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
                            {form.logo ? (
                                <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><LuImage size={20} /></div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => pickImage('logo')}
                                disabled={uploading}
                                className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-gray-100 text-gray-700 text-[13px] font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors"
                            >
                                {uploading && uploadTarget === 'logo' ? <LuLoader size={15} className="animate-spin" /> : <LuUpload size={15} />}
                                {form.logo ? 'Replace logo' : 'Upload logo'}
                            </button>
                            {form.logo && (
                                <button
                                    type="button"
                                    onClick={() => set('logo', '')}
                                    className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl text-[13px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    <LuX size={15} /> Remove
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="w-full h-28 sm:h-32 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden mb-2.5">
                            {form.banner ? (
                                <img src={form.banner} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><LuImage size={24} /></div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => pickImage('banner')}
                                disabled={uploading}
                                className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-gray-100 text-gray-700 text-[13px] font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors"
                            >
                                {uploading && uploadTarget === 'banner' ? <LuLoader size={15} className="animate-spin" /> : <LuUpload size={15} />}
                                {form.banner ? 'Replace banner' : 'Upload banner'}
                            </button>
                            {form.banner && (
                                <button
                                    type="button"
                                    onClick={() => set('banner', '')}
                                    className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl text-[13px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    <LuX size={15} /> Remove
                                </button>
                            )}
                        </div>
                    </div>

                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files)} />
                </div>
            </Section>

            {/* ── Identity ── */}
            <Section title="Business identity">
                <div className="space-y-3.5">
                    <div>
                        <label className={labelCls} htmlFor="c-name">Company name <span className="text-red-500">*</span></label>
                        <input id="c-name" className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} />
                        {errors.name && <p className={errCls}>{errors.name}</p>}
                    </div>

                    <div>
                        <label className={labelCls}>What you sell</label>
                        <div className="grid grid-cols-2 gap-2.5">
                            {([
                                { v: 'product', l: 'Products', icon: LuPackage },
                                { v: 'service', l: 'Services', icon: LuWrench },
                            ] as const).map((o) => (
                                <button
                                    key={o.v}
                                    type="button"
                                    onClick={() => set('type', o.v)}
                                    className={`inline-flex items-center justify-center gap-2 min-h-[46px] rounded-xl text-[13px] font-bold transition-colors ${
                                        form.type === o.v
                                            ? 'bg-[var(--color-primary)] text-white'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:border-[rgba(var(--color-primary-rgb),0.35)]'
                                    }`}
                                >
                                    <o.icon size={15} /> {o.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={labelCls} htmlFor="c-desc">Short description</label>
                        <textarea
                            id="c-desc"
                            rows={2}
                            className={`${inputCls} resize-y`}
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                            placeholder="One line buyers read first — what you supply, and where."
                        />
                    </div>

                    <div>
                        <label className={labelCls} htmlFor="c-about">About your company</label>
                        <textarea
                            id="c-about"
                            rows={5}
                            className={`${inputCls} resize-y`}
                            value={form.about}
                            onChange={(e) => set('about', e.target.value)}
                            placeholder="How long you have traded, what you are known for, how you deliver."
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Categories you supply</label>
                        {catList.length === 0 ? (
                            <p className="text-[12px] text-gray-400">Categories are still loading.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {catList.map((c) => {
                                    const on = categories.includes(c._id);
                                    return (
                                        <button
                                            key={c._id}
                                            type="button"
                                            onClick={() => toggleCategory(c._id)}
                                            className={`px-3.5 min-h-[40px] rounded-xl text-[13px] font-bold transition-colors ${
                                                on
                                                    ? 'bg-[var(--color-primary)] text-white'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[rgba(var(--color-primary-rgb),0.35)]'
                                            }`}
                                        >
                                            {c.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </Section>

            {/* ── Contact ── */}
            <Section title="Contact" subtitle="Buyers and dealers reach you on these. Keep them current.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                        <label className={labelCls} htmlFor="c-phone">
                            <LuPhone size={12} className="inline mr-1 -mt-0.5" /> Phone <span className="text-red-500">*</span>
                        </label>
                        <input id="c-phone" inputMode="tel" className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01XXXXXXXXX" />
                        {errors.phone && <p className={errCls}>{errors.phone}</p>}
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="c-wa">
                            <LuMessageCircle size={12} className="inline mr-1 -mt-0.5" /> WhatsApp
                        </label>
                        <input id="c-wa" inputMode="tel" className={inputCls} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="01XXXXXXXXX" />
                        {errors.whatsapp && <p className={errCls}>{errors.whatsapp}</p>}
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="c-email">
                            <LuMail size={12} className="inline mr-1 -mt-0.5" /> Email
                        </label>
                        <input id="c-email" type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@company.com" />
                        {errors.email && <p className={errCls}>{errors.email}</p>}
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="c-web">
                            <LuGlobe size={12} className="inline mr-1 -mt-0.5" /> Website
                        </label>
                        <input id="c-web" className={inputCls} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
                    </div>
                </div>
            </Section>

            {/* ── Head office ── */}
            <Section title="Head office" subtitle="Nothing routes on this — you sell nationwide. It only tells buyers where you are based.">
                <div className="space-y-3.5">
                    <div>
                        <label className={labelCls} htmlFor="c-address">
                            <LuMapPin size={12} className="inline mr-1 -mt-0.5" /> Address <span className="text-red-500">*</span>
                        </label>
                        <input id="c-address" className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="House, road, area" />
                        {errors.address && <p className={errCls}>{errors.address}</p>}
                    </div>
                    <AreaSelect label="Area" value={area} onChange={setArea} />
                </div>
            </Section>

            {/* ── Documents ── */}
            <Section title="Verification documents" subtitle="Kept private — never shown on your public storefront.">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                        <label className={labelCls} htmlFor="c-license">
                            <LuFileText size={12} className="inline mr-1 -mt-0.5" /> Trade licence no.
                        </label>
                        <input id="c-license" className={inputCls} value={form.tradeLicense} onChange={(e) => set('tradeLicense', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="c-tin">TIN</label>
                        <input id="c-tin" className={inputCls} value={form.tin} onChange={(e) => set('tin', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="c-bin">BIN</label>
                        <input id="c-bin" className={inputCls} value={form.bin} onChange={(e) => set('bin', e.target.value)} />
                    </div>
                </div>
            </Section>

            {/* Sticky save on phones — the form is long and the button would be far away. */}
            <div className="fixed sm:static bottom-0 left-0 right-0 z-30 bg-white sm:bg-transparent border-t sm:border-0 border-gray-100 p-3 sm:p-0">
                <button
                    type="submit"
                    disabled={saving || uploading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 min-h-[50px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold shadow-md shadow-[rgba(var(--color-primary-rgb),0.25)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 transition-colors"
                >
                    {saving ? <LuLoader size={16} className="animate-spin" /> : <LuSave size={16} />}
                    Save profile
                </button>
            </div>
        </form>
    );
}
