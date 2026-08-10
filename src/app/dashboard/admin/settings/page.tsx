"use client";

import React, { useState, useEffect } from 'react';
import {
    LuSettings, LuGlobe, LuSave, LuRefreshCw,
    LuCircleCheck, LuInfo, LuShield, LuDroplet,
} from 'react-icons/lu';
import { useGetSiteContentQuery, useUpdateSiteContentMutation } from '@/redux/api/siteContentApi';
import { SingleImageUploader } from '@/components/ui/ImageUploader';
import { BRAND_PRIMARY } from '@/config/brand';
import toast from 'react-hot-toast';

/* ─── Reusable Components ─── */
const SettingSection = ({ icon: Icon, title, description, children }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Icon size={18} className="text-[var(--color-primary)]" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
                    <p className="text-xs text-gray-500">{description}</p>
                </div>
            </div>
        </div>
        <div className="p-6 space-y-5">
            {children}
        </div>
    </div>
);

const InputField = ({ label, type = 'text', value, onChange, placeholder, helper, ...props }: any) => (
    <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
        {type === 'textarea' ? (
            <textarea
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-medium text-sm h-20 resize-none"
                value={value} onChange={onChange} placeholder={placeholder} {...props}
            />
        ) : (
            <input
                type={type}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-medium text-sm"
                value={value} onChange={onChange} placeholder={placeholder} {...props}
            />
        )}
        {helper && <p className="text-[10px] text-gray-400 mt-1 italic">{helper}</p>}
    </div>
);

/* No ColorPicker here on purpose — the brand colour is owned by
   BRAND_PRIMARY in src/config/brand.ts, not by the database. */

export default function SettingsPage() {
    const { data: res, isLoading } = useGetSiteContentQuery({});
    const [updateContent, { isLoading: isSaving }] = useUpdateSiteContentMutation();

    const [formData, setFormData] = useState<any>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (res?.data) {
            setFormData({
                general: res.data.general || {
                    storeName: 'Mawa Homebazar BD',
                    tagline: 'Your trusted online marketplace',
                    currency: 'BDT',
                },
                seo: res.data.seo || {
                    title: '',
                    description: '',
                    googleAnalyticsId: '',
                    facebookPixel: '',
                },
                theme: res.data.theme || {
                    primaryColor: 'var(--color-primary)',
                    secondaryColor: 'var(--color-secondary)',
                    logoUrl: '',
                    faviconUrl: '',
                },
            });
        }
    }, [res]);

    const updateGeneral = (field: string, value: any) => {
        setFormData((p: any) => ({ ...p, general: { ...p.general, [field]: value } }));
    };
    const updateSeo = (field: string, value: any) => {
        setFormData((p: any) => ({ ...p, seo: { ...p.seo, [field]: value } }));
    };
    const updateTheme = (field: string, value: any) => {
        setFormData((p: any) => ({ ...p, theme: { ...p.theme, [field]: value } }));
    };

    const handleSave = async () => {
        try {
            await updateContent(formData).unwrap();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            toast.success('Settings saved! Refresh the site to see changes.');
        } catch (error) {
            toast.error('Failed to save settings');
        }
    };

    if (isLoading || !formData) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
            </div>
        );
    }

    const g = formData.general || {};
    const seo = formData.seo || {};
    const theme = formData.theme || {};

    return (
        // max-w-5xl kept the form narrow but without mx-auto it hugged the left
        // edge and left a wide gap on the right — centre it in the page.
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your store preferences and configuration</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <LuRefreshCw size={16} className="animate-spin" /> : saveSuccess ? <LuCircleCheck size={16} /> : <LuSave size={16} />}
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <LuInfo size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-blue-800">Configuration Center</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                        Changes are saved to the database and apply globally. Contact details are managed in <a href="/dashboard/admin/site-content" className="font-bold underline">Site Content</a>.
                    </p>
                </div>
            </div>

            {/* All Settings */}
            <div className="space-y-6">

                {/* ═══════ APPEARANCE ═══════ */}
                <SettingSection icon={LuDroplet} title="🎨 Appearance — Colors & Logo" description="Change your website's brand colors and logo from here">

                    {/* Colors — fixed in code, not stored in the database. */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3">Brand Color</h4>
                        <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-lightest)]">
                            <span
                                className="w-10 h-10 rounded-lg flex-shrink-0 border border-black/10"
                                style={{ background: 'var(--color-primary)' }}
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800">
                                    {BRAND_PRIMARY}
                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">set in code</span>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    The brand colour is intentionally not editable from here. It lives in a single
                                    variable — <code className="px-1 py-0.5 rounded bg-white/70 font-mono text-[11px]">BRAND_PRIMARY</code> in{' '}
                                    <code className="px-1 py-0.5 rounded bg-white/70 font-mono text-[11px]">src/config/brand.ts</code> — and every
                                    shade, button, badge and border on the site is derived from it. Change that one line to re-skin the whole site.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3">Live Preview</h4>
                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                {theme.logoUrl ? (
                                    <img src={theme.logoUrl} alt="Logo" className="h-8 object-contain" />
                                ) : (
                                    <div className="h-8 px-4 rounded-md flex items-center text-white font-bold text-sm" style={{ background: 'var(--color-primary)' }}>
                                        {g.storeName || 'Mawa Homebazar BD'}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button className="px-5 py-2 rounded-lg text-white text-xs font-bold" style={{ background: 'var(--color-primary)' }}>
                                    Buy Now
                                </button>
                                <button className="px-5 py-2 rounded-lg text-white text-xs font-bold" style={{ background: 'var(--color-secondary)' }}>
                                    Sale 50% Off
                                </button>
                                <span className="px-3 py-1.5 rounded-full text-white text-[10px] font-bold" style={{ background: 'var(--color-primary)' }}>
                                    New Arrival
                                </span>
                                <span className="px-3 py-1.5 rounded-full text-white text-[10px] font-bold" style={{ background: 'var(--color-secondary)' }}>
                                    Hot Deal
                                </span>
                            </div>
                            <div className="mt-3 flex gap-3">
                                <a href="#" className="text-sm font-bold underline" style={{ color: 'var(--color-primary)' }}>Sample Link</a>
                                <span className="text-sm font-bold" style={{ color: 'var(--color-secondary)' }}>৳2,499</span>
                            </div>
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3">Logo & Favicon</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SingleImageUploader
                                label="Website Logo"
                                value={theme.logoUrl || ''}
                                onChange={url => updateTheme('logoUrl', url)}
                            />
                            <SingleImageUploader
                                label="Favicon (Site Icon)"
                                value={theme.faviconUrl || ''}
                                onChange={url => updateTheme('faviconUrl', url)}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 italic">Logo appears in the header & footer. Favicon appears in the browser tab.</p>
                    </div>

                </SettingSection>

                {/* ═══════ GENERAL ═══════ */}
                <SettingSection icon={LuSettings} title="Store Information" description="Basic store identity">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField label="Store Name" value={g.storeName || ''} onChange={(e: any) => updateGeneral('storeName', e.target.value)} placeholder="Your Store Name" />
                        <InputField label="Tagline" value={g.tagline || ''} onChange={(e: any) => updateGeneral('tagline', e.target.value)} placeholder="Your Store Tagline" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Currency</label>
                            <select value={g.currency || 'BDT'} onChange={(e) => updateGeneral('currency', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-medium text-sm"
                            >
                                <option value="BDT">৳ BDT - Bangladeshi Taka</option>
                                <option value="USD">$ USD - US Dollar</option>
                                <option value="EUR">€ EUR - Euro</option>
                                <option value="CNY">¥ CNY - Chinese Yuan</option>
                            </select>
                        </div>
                    </div>
                </SettingSection>

                {/* ═══════ SEO ═══════ */}
                <SettingSection icon={LuGlobe} title="SEO & Marketing" description="Search engine and tracking settings">
                    <InputField label="Meta Title" value={seo.title || ''} onChange={(e: any) => updateSeo('title', e.target.value)} placeholder="Mawa Homebazar BD - Your trusted online marketplace" helper="Recommended: 50-60 characters" />
                    <InputField label="Meta Description" type="textarea" value={seo.description || ''} onChange={(e: any) => updateSeo('description', e.target.value)} placeholder="Brief description of your store" helper="Recommended: 150-160 characters" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField label="Google Analytics ID" value={seo.googleAnalyticsId || ''} onChange={(e: any) => updateSeo('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" helper="Your GA4 measurement ID" />
                        <InputField label="Facebook Pixel ID" value={seo.facebookPixel || ''} onChange={(e: any) => updateSeo('facebookPixel', e.target.value)} placeholder="123456789" helper="For Facebook Ads tracking" />
                    </div>
                </SettingSection>

                {/* ═══════ SYSTEM INFO ═══════ */}
                <SettingSection icon={LuShield} title="System Information" description="Current system status">
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'App Version', value: 'v1.0.0' },
                            { label: 'Framework', value: 'Next.js 16' },
                            { label: 'API Status', value: 'Connected', ok: true },
                            { label: 'Database', value: 'MongoDB Atlas', ok: true },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                                <span className={`text-xs font-bold flex items-center gap-1 ${(item as any).ok ? 'text-green-600' : 'text-gray-700'}`}>
                                    {(item as any).ok && <LuCircleCheck size={11} />}
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </SettingSection>

            </div>
        </div>
    );
}
