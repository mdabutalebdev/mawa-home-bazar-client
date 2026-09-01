"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useGetSiteContentQuery, useUpdateSiteContentMutation, useGetAllLegalPagesQuery, useUpdateLegalPageMutation } from '@/redux/api/siteContentApi';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import {
    LuPhone, LuMessageCircle, LuLayoutDashboard, LuFileText, LuImage,
    LuSave, LuPlus, LuTrash2, LuCircleCheck, LuArrowUp, LuArrowDown, LuCreditCard,
    LuHouse, LuInfo, LuGrid2X2, LuStar, LuTags, LuListChecks, LuAward, LuQuote,
} from 'react-icons/lu';
import { SingleImageUploader, MultipleImageUploader } from '@/components/ui/ImageUploader';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div style={{ height: '350px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} /> });
import 'react-quill-new/dist/quill.snow.css';

/* ─── Styles ─── */
const card: React.CSSProperties = { background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '20px', marginBottom: '16px' };
const label: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '5px' };
const input: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const };
const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' };
const btnPrimary: React.CSSProperties = { ...btn, background: 'var(--color-primary)', color: '#fff' };
const btnDanger: React.CSSProperties = { ...btn, background: '#fef2f2', color: '#dc2626', padding: '6px 10px' };
const btnSmall: React.CSSProperties = { ...btn, background: '#f3f4f6', color: '#333', padding: '6px 12px', fontSize: '12px' };

/* ─── Tabs Config ─── */
const TABS = [
    { key: 'hero', label: '🖼️ Hero Slides', icon: LuImage },
    { key: 'stats', label: 'Stats Bar', icon: LuHouse },
    { key: 'about', label: 'About Section', icon: LuInfo },
    { key: 'services', label: 'Services', icon: LuGrid2X2 },
    { key: 'serviceCompanies', label: 'Service Companies', icon: LuGrid2X2 },
    { key: 'features', label: 'Features', icon: LuStar },
    { key: 'catShowcase', label: 'Category Showcase', icon: LuTags },
    { key: 'howItWorks', label: 'How It Works', icon: LuListChecks },
    { key: 'experience', label: 'Experience', icon: LuAward },
    { key: 'reviews', label: 'Reviews', icon: LuQuote },
    { key: 'contact', label: 'Contact Page', icon: LuPhone },
    { key: 'payment', label: 'Payment Numbers', icon: LuCreditCard },
    { key: 'floating', label: 'Floating Widget', icon: LuMessageCircle },
    { key: 'footer', label: 'Footer', icon: LuLayoutDashboard },
    { key: 'legal', label: 'Legal Pages', icon: LuFileText },
];

export default function SiteContentPage() {
    const { data: res, isLoading } = useGetSiteContentQuery({});
    const [updateContent, { isLoading: isSaving }] = useUpdateSiteContentMutation();
    const [activeTab, setActiveTab] = useState('contact');
    const [formData, setFormData] = useState<any>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (res?.data) {
            setFormData(JSON.parse(JSON.stringify(res.data)));
        }
    }, [res]);

    // Maps a tab key to the top-level siteContent field(s) that the tab edits.
    // Adding a new tab? Add its field name(s) here.
    const TAB_TO_FIELDS: Record<string, string[]> = {
        hero:        ['heroSlides', 'homeBanner'],
        stats:       ['statsBar'],
        about:       ['aboutSection'],
        services:    ['servicesSection'],
        serviceCompanies: ['serviceCompaniesSection'],
        features:    ['featuresSection'],
        catShowcase: ['categoryShowcaseSection'],
        howItWorks:  ['howItWorksSection'],
        experience:  ['experienceSection'],
        reviews:     ['reviewsSection'],
        contact:     ['contact'],
        payment:     ['payment'],
        floating:    ['floating'],
        footer:      ['footer'],
    };

    const handleSave = async () => {
        if (activeTab === 'legal') return; // Legal pages have their own save
        try {
            const fields = TAB_TO_FIELDS[activeTab] || [activeTab];
            const payload: any = {};
            for (const f of fields) payload[f] = formData[f];
            await updateContent(payload).unwrap();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            toast.success('Saved successfully!');
        } catch {
            toast.error('Failed to save');
        }
    };

    if (isLoading || !formData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0 }}>Site Content</h1>
                    <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>Manage dynamic content across your website</p>
                </div>
                <button onClick={handleSave} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.6 : 1 }}>
                    {saveSuccess ? <><LuCircleCheck size={14} /> Saved!</> : <><LuSave size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}</>}
                </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: '1px' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', border: 'none', cursor: 'pointer',
                            fontSize: '12.5px', fontWeight: activeTab === tab.key ? 700 : 500,
                            color: activeTab === tab.key ? 'var(--color-primary)' : '#888',
                            background: activeTab === tab.key ? 'var(--color-primary-lightest)' : 'transparent',
                            borderRadius: '6px 6px 0 0',
                            borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                            transition: 'all 0.15s',
                        }}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'hero' && <HeroSlidesTab data={formData} setData={setFormData} onSave={handleSave} isSaving={isSaving} />}
            {activeTab === 'stats' && <StatsBarTab data={formData} setData={setFormData} />}
            {activeTab === 'about' && <AboutSectionTab data={formData} setData={setFormData} />}
            {activeTab === 'services' && <ServicesSectionTab data={formData} setData={setFormData} />}
            {activeTab === 'serviceCompanies' && <ServiceCompaniesSectionTab data={formData} setData={setFormData} />}
            {activeTab === 'features' && <FeaturesSectionTab data={formData} setData={setFormData} />}
            {activeTab === 'catShowcase' && <CategoryShowcaseTab data={formData} setData={setFormData} />}
            {activeTab === 'howItWorks' && <HowItWorksTab data={formData} setData={setFormData} />}
            {activeTab === 'experience' && <ExperienceSectionTab data={formData} setData={setFormData} />}
            {activeTab === 'reviews' && <ReviewsSectionTab data={formData} setData={setFormData} />}
            {activeTab === 'contact' && <ContactTab data={formData} setData={setFormData} />}
            {activeTab === 'payment' && <PaymentTab data={formData} setData={setFormData} />}
            {activeTab === 'floating' && <FloatingTab data={formData} setData={setFormData} />}
            {activeTab === 'footer' && <FooterTab data={formData} setData={setFormData} />}
            {activeTab === 'legal' && <LegalPagesTab />}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ─── Shared helpers for the six home-section editors ─── */
/* ═══════════════════════════════════════════════════════════════════ */

/**
 * Section-enabled toggle — every home section can be turned off entirely.
 * Rendered at the top of each tab so the admin sees the switch first.
 */
function EnabledToggle({
    enabled, onChange, hint,
}: { enabled: boolean; onChange: (v: boolean) => void; hint?: string }) {
    return (
        <div
            style={{
                ...card,
                background: enabled ? 'var(--color-primary-lightest)' : '#fef2f2',
                borderColor: enabled ? '#bbf7d0' : '#fecaca',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            }}
        >
            <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: enabled ? '#16a34a' : '#dc2626' }}>
                    {enabled ? 'Section is Visible on Homepage' : 'Section is Hidden'}
                </div>
                {hint && <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{hint}</div>}
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onChange(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>Show</span>
            </label>
        </div>
    );
}

/** Move an array element up or down (used by every list editor below). */
function moveItem<T>(arr: T[], idx: number, dir: 'up' | 'down'): T[] {
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= arr.length) return arr;
    const next = [...arr];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    return next.map((it: any, i: number) => ({ ...it, order: i }));
}

/* ─────────────────── Bilingual inputs ─────────────────── */
// Every string in the home-section schema is `{ en, bn }` — old plain-string
// values are read forward with `readBi`, but everything written back to the
// server goes as the object shape so the frontend can render the right one.

type Bi = { en?: string; bn?: string } | string | null | undefined;

/** Read a possibly-legacy field as `{ en, bn }` so both inputs render. */
function readBi(v: Bi): { en: string; bn: string } {
    if (v == null) return { en: '', bn: '' };
    if (typeof v === 'string') return { en: v, bn: v };
    return { en: v.en || '', bn: v.bn || '' };
}

/** Small side-by-side EN + BN input, one line each — for titles and short fields. */
function BiInput({
    label: labelText, value, onChange, placeholderEn, placeholderBn,
}: {
    label: string;
    value: Bi;
    onChange: (v: { en: string; bn: string }) => void;
    placeholderEn?: string;
    placeholderBn?: string;
}) {
    const cur = readBi(value);
    return (
        <div>
            <label style={label}>{labelText}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                    <span style={badge}>EN</span>
                    <input
                        value={cur.en}
                        onChange={e => onChange({ ...cur, en: e.target.value })}
                        placeholder={placeholderEn}
                        style={{ ...input, paddingLeft: '38px' }}
                    />
                </div>
                <div style={{ position: 'relative' }}>
                    <span style={{ ...badge, background: '#fef3c7', color: '#92400e' }}>BN</span>
                    <input
                        value={cur.bn}
                        onChange={e => onChange({ ...cur, bn: e.target.value })}
                        placeholder={placeholderBn}
                        style={{ ...input, paddingLeft: '38px' }}
                    />
                </div>
            </div>
        </div>
    );
}

/** Same, but with textareas — for descriptions and long paragraphs. */
function BiTextarea({
    label: labelText, value, onChange, rows = 4, placeholderEn, placeholderBn,
}: {
    label: string;
    value: Bi;
    onChange: (v: { en: string; bn: string }) => void;
    rows?: number;
    placeholderEn?: string;
    placeholderBn?: string;
}) {
    const cur = readBi(value);
    const ta: React.CSSProperties = { ...input, paddingLeft: '38px', resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.55 };
    return (
        <div>
            <label style={label}>{labelText}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                    <span style={badge}>EN</span>
                    <textarea
                        value={cur.en}
                        onChange={e => onChange({ ...cur, en: e.target.value })}
                        placeholder={placeholderEn}
                        rows={rows}
                        style={ta}
                    />
                </div>
                <div style={{ position: 'relative' }}>
                    <span style={{ ...badge, background: '#fef3c7', color: '#92400e' }}>BN</span>
                    <textarea
                        value={cur.bn}
                        onChange={e => onChange({ ...cur, bn: e.target.value })}
                        placeholder={placeholderBn}
                        rows={rows}
                        style={ta}
                    />
                </div>
            </div>
        </div>
    );
}

const badge: React.CSSProperties = {
    position: 'absolute',
    top: '11px',
    left: '6px',
    background: '#e0f2fe',
    color: '#075985',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
    lineHeight: 1,
    pointerEvents: 'none',
    zIndex: 2,
};

/* ─── STATS BAR TAB ─── */
function StatsBarTab({ data, setData }: { data: any; setData: any }) {
    const s = data.statsBar || { enabled: true, items: [] };
    const set = (patch: any) =>
        setData((p: any) => ({ ...p, statsBar: { ...(p.statsBar || {}), ...patch } }));
    const setItems = (items: any[]) => set({ items });

    const add = () => setItems([...(s.items || []), { value: '', label: '', icon: '', active: true, order: (s.items || []).length }]);
    const update = (idx: number, field: string, v: any) => {
        const items = [...s.items]; items[idx] = { ...items[idx], [field]: v };
        setItems(items);
    };
    const remove = (idx: number) => setItems(s.items.filter((_: any, i: number) => i !== idx));
    const move = (idx: number, dir: 'up' | 'down') => setItems(moveItem(s.items, idx, dir));

    return (
        <div>
            <EnabledToggle
                enabled={s.enabled !== false}
                onChange={(v) => set({ enabled: v })}
                hint="The row of tiles under the hero banner (e.g. “2,00,000+ resellers”)."
            />
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Highlight Tiles</h3>
                    <button onClick={add} style={btnSmall}><LuPlus size={13} /> Add Tile</button>
                </div>
                {(s.items || []).map((it: any, idx: number) => (
                    <div key={idx} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '10px', marginBottom: '8px', background: '#fafafa' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <input value={it.icon || ''} onChange={e => update(idx, 'icon', e.target.value)} placeholder="🎯" style={{ ...input, textAlign: 'center' }} />
                            <input value={it.value || ''} onChange={e => update(idx, 'value', e.target.value)} placeholder="2,00,000+ (shown as-is in both languages)" style={input} />
                            <div style={{ display: 'flex', gap: '2px' }}>
                                <button onClick={() => move(idx, 'up')} disabled={idx === 0} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === 0 ? 0.3 : 1 }}><LuArrowUp size={12} /></button>
                                <button onClick={() => move(idx, 'down')} disabled={idx === s.items.length - 1} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === s.items.length - 1 ? 0.3 : 1 }}><LuArrowDown size={12} /></button>
                            </div>
                            <button onClick={() => remove(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                        </div>
                        <BiInput label="Label" value={it.label} onChange={v => update(idx, 'label', v)} placeholderEn="Resellers / Dropshippers" placeholderBn="রিসেলার / ড্রপশিপার" />
                    </div>
                ))}
                {(s.items || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No tiles yet. Click “Add Tile”.</p>}
            </div>
        </div>
    );
}

/* ─── ABOUT SECTION TAB ─── */
function AboutSectionTab({ data, setData }: { data: any; setData: any }) {
    const s = data.aboutSection || {};
    const set = (patch: any) =>
        setData((p: any) => ({ ...p, aboutSection: { ...(p.aboutSection || {}), ...patch } }));

    return (
        <div>
            <EnabledToggle
                enabled={s.enabled !== false}
                onChange={(v) => set({ enabled: v })}
                hint="About section (text on the left, image on the right) shown near the top of the homepage."
            />
            <div style={card}>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <BiInput label="Title" value={s.title} onChange={v => set({ title: v })} placeholderEn="About Us" placeholderBn="আমাদের সম্পর্কে" />
                    <BiTextarea label="Description (long paragraph)" value={s.description} onChange={v => set({ description: v })} rows={7} placeholderEn="A few lines about your company…" placeholderBn="আমাদের কোম্পানি সম্পর্কে দুই-তিন লাইন…" />
                    <div>
                        <label style={label}>Image — shown on the right side (landscape works best, e.g. 800×600 / 4:3). Leave blank to show a branded placeholder.</label>
                        <SingleImageUploader label="About Image" value={s.imageUrl || ''} onChange={(url: string) => set({ imageUrl: url })} />
                    </div>
                    <BiInput label="CTA button text (blank = no button)" value={s.ctaLabel} onChange={v => set({ ctaLabel: v })} placeholderEn="Learn More" placeholderBn="বিস্তারিত জানুন" />
                    <div>
                        <label style={label}>CTA button link</label>
                        <input value={s.ctaHref || ''} onChange={e => set({ ctaHref: e.target.value })} style={input} placeholder="/about" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── SERVICES TAB ─── */
function ServicesSectionTab({ data, setData }: { data: any; setData: any }) {
    const s = data.servicesSection || { enabled: true, items: [] };
    const set = (patch: any) =>
        setData((p: any) => ({ ...p, servicesSection: { ...(p.servicesSection || {}), ...patch } }));
    const setItems = (items: any[]) => set({ items });

    const add = () => setItems([...(s.items || []), { image: '', icon: '', title: '', description: '', link: '', active: true, order: (s.items || []).length }]);
    const update = (idx: number, field: string, v: any) => {
        const items = [...s.items]; items[idx] = { ...items[idx], [field]: v }; setItems(items);
    };
    const remove = (idx: number) => setItems(s.items.filter((_: any, i: number) => i !== idx));
    const move = (idx: number, dir: 'up' | 'down') => setItems(moveItem(s.items, idx, dir));

    return (
        <div>
            <EnabledToggle enabled={s.enabled !== false} onChange={(v) => set({ enabled: v })} hint="Image cards, 2 per row (up to 16). Tapping a card opens the service-request form. Title & description are optional — an image alone works." />
            <div style={card}>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <BiInput label="Section Title" value={s.title} onChange={v => set({ title: v })} placeholderEn="Our Services" placeholderBn="আমাদের সার্ভিস সমূহ" />
                    <BiInput label="Subtitle" value={s.subtitle} onChange={v => set({ subtitle: v })} placeholderEn="What our platform offers" placeholderBn="আমাদের প্লাটফর্মে যা পাচ্ছেন" />
                </div>
            </div>
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Service Items ({(s.items || []).length})</h3>
                    <button onClick={add} style={btnSmall}><LuPlus size={13} /> Add Service</button>
                </div>
                {(s.items || []).map((it: any, idx: number) => (
                    <div key={idx} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px', marginBottom: '10px', background: '#fafafa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#666' }}>Service {idx + 1}</span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                <button onClick={() => move(idx, 'up')} disabled={idx === 0} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === 0 ? 0.3 : 1 }}><LuArrowUp size={12} /></button>
                                <button onClick={() => move(idx, 'down')} disabled={idx === s.items.length - 1} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === s.items.length - 1 ? 0.3 : 1 }}><LuArrowDown size={12} /></button>
                                <button onClick={() => remove(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', alignItems: 'start' }}>
                            <SingleImageUploader label="Card image" value={it.image || ''} onChange={(url: string) => update(idx, 'image', url)} />
                            <div style={{ display: 'grid', gap: '8px' }}>
                                <BiInput label="Title (optional)" value={it.title} onChange={v => update(idx, 'title', v)} placeholderEn="Service name" placeholderBn="সার্ভিসের নাম" />
                                <BiInput label="Description (optional)" value={it.description} onChange={v => update(idx, 'description', v)} placeholderEn="Short description" placeholderBn="সংক্ষিপ্ত বিবরণ" />
                            </div>
                        </div>
                    </div>
                ))}
                {(s.items || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No services yet. Click “Add Service”.</p>}
            </div>
        </div>
    );
}

/* ─── SERVICE COMPANIES TAB ───
   Admin-managed showcase of partner / service-provider companies. Same shape
   as ServicesSection but each card carries a company logo + bilingual title +
   bilingual description + optional external link. Rendered on the homepage
   right before the product category showcase. */
function ServiceCompaniesSectionTab({ data, setData }: { data: any; setData: any }) {
    const s = data.serviceCompaniesSection || { enabled: true, items: [] };
    const set = (patch: any) =>
        setData((p: any) => ({ ...p, serviceCompaniesSection: { ...(p.serviceCompaniesSection || {}), ...patch } }));
    const setItems = (items: any[]) => set({ items });

    const add = () => setItems([...(s.items || []), { logo: '', title: '', description: '', link: '', active: true, order: (s.items || []).length }]);
    const update = (idx: number, field: string, v: any) => {
        const items = [...s.items]; items[idx] = { ...items[idx], [field]: v }; setItems(items);
    };
    const remove = (idx: number) => setItems(s.items.filter((_: any, i: number) => i !== idx));
    const move = (idx: number, dir: 'up' | 'down') => setItems(moveItem(s.items, idx, dir));

    return (
        <div>
            <EnabledToggle enabled={s.enabled !== false} onChange={(v) => set({ enabled: v })} hint="Logo cards for partner / service-provider companies. Each card shows the logo, title, and short description. Optionally link to the company page. Up to 24 shown; hidden ones are skipped." />
            <div style={card}>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <BiInput label="Section Title" value={s.title} onChange={v => set({ title: v })} placeholderEn="Our Company Services" placeholderBn="আমাদের কোম্পানি সার্ভিস সমূহ" />
                    <BiInput label="Subtitle" value={s.subtitle} onChange={v => set({ subtitle: v })} placeholderEn="Our trusted partners" placeholderBn="আমাদের সাথে সংযুক্ত পার্টনার প্রতিষ্ঠান ও সার্ভিস সমূহ।" />
                </div>
            </div>
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Companies ({(s.items || []).length})</h3>
                    <button onClick={add} style={btnSmall}><LuPlus size={13} /> Add Company</button>
                </div>
                {(s.items || []).map((it: any, idx: number) => (
                    <div key={idx} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px', marginBottom: '10px', background: '#fafafa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#666' }}>Company {idx + 1}</span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                <button onClick={() => move(idx, 'up')} disabled={idx === 0} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === 0 ? 0.3 : 1 }}><LuArrowUp size={12} /></button>
                                <button onClick={() => move(idx, 'down')} disabled={idx === s.items.length - 1} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === s.items.length - 1 ? 0.3 : 1 }}><LuArrowDown size={12} /></button>
                                <button
                                    onClick={() => update(idx, 'active', !(it.active !== false))}
                                    style={{ ...btnSmall, padding: '6px 10px', background: it.active !== false ? '#dcfce7' : '#f3f4f6', color: it.active !== false ? '#16a34a' : '#666' }}
                                    title={it.active !== false ? 'Visible — click to hide' : 'Hidden — click to show'}
                                >
                                    {it.active !== false ? 'Visible' : 'Hidden'}
                                </button>
                                <button onClick={() => remove(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', alignItems: 'start' }}>
                            <SingleImageUploader label="Company logo" value={it.logo || ''} onChange={(url: string) => update(idx, 'logo', url)} />
                            <div style={{ display: 'grid', gap: '8px' }}>
                                <BiInput label="Company name" value={it.title} onChange={v => update(idx, 'title', v)} placeholderEn="Company name" placeholderBn="কোম্পানির নাম" />
                                <BiTextarea label="Description" value={it.description} onChange={v => update(idx, 'description', v)} rows={2} placeholderEn="Short description of what the company offers" placeholderBn="কোম্পানি সংক্রান্ত সংক্ষিপ্ত বিবরণ" />
                                <div>
                                    <label style={label}>Link (optional)</label>
                                    <input
                                        value={it.link || ''}
                                        onChange={e => update(idx, 'link', e.target.value)}
                                        placeholder="https://example.com  or  /companies/slug"
                                        style={input}
                                    />
                                    <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>Blank = card is non-clickable. External URLs open in a new tab.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {(s.items || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No companies yet. Click “Add Company”.</p>}
            </div>
        </div>
    );
}

/* ─── FEATURES TAB ─── */
function FeaturesSectionTab({ data, setData }: { data: any; setData: any }) {
    const s = data.featuresSection || { enabled: true, items: [] };
    const set = (patch: any) =>
        setData((p: any) => ({ ...p, featuresSection: { ...(p.featuresSection || {}), ...patch } }));
    const setItems = (items: any[]) => set({ items });

    const add = () => setItems([...(s.items || []), { icon: '✨', title: '', description: '', active: true, order: (s.items || []).length }]);
    const update = (idx: number, field: string, v: any) => {
        const items = [...s.items]; items[idx] = { ...items[idx], [field]: v }; setItems(items);
    };
    const remove = (idx: number) => setItems(s.items.filter((_: any, i: number) => i !== idx));
    const move = (idx: number, dir: 'up' | 'down') => setItems(moveItem(s.items, idx, dir));

    return (
        <div>
            <EnabledToggle enabled={s.enabled !== false} onChange={(v) => set({ enabled: v })} hint="“Why us” cards with an icon, title and one-line description." />
            <div style={card}>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <BiInput label="Section Title" value={s.title} onChange={v => set({ title: v })} placeholderEn="Our Special Features" placeholderBn="আমাদের স্পেশিয়াল ফিচারস" />
                    <BiInput label="Subtitle" value={s.subtitle} onChange={v => set({ subtitle: v })} placeholderEn="Why customers choose us" placeholderBn="কেন আমাদের বেছে নেবেন" />
                </div>
            </div>
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Feature Items ({(s.items || []).length})</h3>
                    <button onClick={add} style={btnSmall}><LuPlus size={13} /> Add Feature</button>
                </div>
                {(s.items || []).map((it: any, idx: number) => (
                    <div key={idx} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '10px', marginBottom: '8px', background: '#fafafa' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <input value={it.icon || ''} onChange={e => update(idx, 'icon', e.target.value)} placeholder="⚡" style={{ ...input, textAlign: 'center' }} title="Emoji or image URL" />
                            <span style={{ fontSize: '11px', color: '#666' }}>Feature {idx + 1}</span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                <button onClick={() => move(idx, 'up')} disabled={idx === 0} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === 0 ? 0.3 : 1 }}><LuArrowUp size={12} /></button>
                                <button onClick={() => move(idx, 'down')} disabled={idx === s.items.length - 1} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === s.items.length - 1 ? 0.3 : 1 }}><LuArrowDown size={12} /></button>
                            </div>
                            <button onClick={() => remove(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <BiInput label="Feature title" value={it.title} onChange={v => update(idx, 'title', v)} placeholderEn="Feature title" placeholderBn="ফিচারের নাম" />
                            <BiTextarea label="Feature description" value={it.description} onChange={v => update(idx, 'description', v)} rows={3} placeholderEn="What this feature does…" placeholderBn="এই ফিচার কী করে…" />
                        </div>
                    </div>
                ))}
                {(s.items || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No features yet. Click “Add Feature”.</p>}
            </div>
        </div>
    );
}

/* ─── CATEGORY SHOWCASE TAB ─── */
function CategoryShowcaseTab({ data, setData }: { data: any; setData: any }) {
    const s = data.categoryShowcaseSection || {};
    const set = (patch: any) =>
        setData((p: any) => ({ ...p, categoryShowcaseSection: { ...(p.categoryShowcaseSection || {}), ...patch } }));

    return (
        <div>
            <EnabledToggle
                enabled={s.enabled !== false}
                onChange={(v) => set({ enabled: v })}
                hint="Chip grid of your categories on the homepage. Categories come from the Category admin panel."
            />
            <div style={card}>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <BiInput label="Title" value={s.title} onChange={v => set({ title: v })} placeholderEn="Our Products" placeholderBn="আমাদের প্রোডাক্ট সমূহ" />
                    <BiInput label="Subtitle" value={s.subtitle} onChange={v => set({ subtitle: v })} placeholderEn="Optional line under the title" placeholderBn="ঐচ্ছিক সাব-টেক্সট" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={label}>Number of categories to show</label>
                            <input type="number" min={1} max={200} value={s.showCount ?? 60} onChange={e => set({ showCount: Number(e.target.value) || 0 })} style={input} />
                        </div>
                        <div>
                            <label style={label}>Which categories</label>
                            <select value={s.onlyHome ? 'home' : 'all'} onChange={e => set({ onlyHome: e.target.value === 'home' })} style={input}>
                                <option value="all">All top-level categories</option>
                                <option value="home">Only categories flagged “Show on Home”</option>
                            </select>
                        </div>
                    </div>
                    <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>
                        Manage the actual categories (name, image, icon, home-flag) in <strong>Dashboard → Categories</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─── HOW IT WORKS TAB ─── */
function HowItWorksTab({ data, setData }: { data: any; setData: any }) {
    const s = data.howItWorksSection || { enabled: true, steps: [] };
    const set = (patch: any) =>
        setData((p: any) => ({ ...p, howItWorksSection: { ...(p.howItWorksSection || {}), ...patch } }));
    const setSteps = (steps: any[]) => set({ steps });

    const add = () => setSteps([...(s.steps || []), { step: String((s.steps || []).length + 1), title: '', description: '', active: true, order: (s.steps || []).length }]);
    const update = (idx: number, field: string, v: any) => {
        const steps = [...s.steps]; steps[idx] = { ...steps[idx], [field]: v }; setSteps(steps);
    };
    const remove = (idx: number) => setSteps(s.steps.filter((_: any, i: number) => i !== idx));
    const move = (idx: number, dir: 'up' | 'down') => setSteps(moveItem(s.steps, idx, dir));

    return (
        <div>
            <EnabledToggle enabled={s.enabled !== false} onChange={(v) => set({ enabled: v })} hint="Numbered steps that walk visitors through your business flow." />
            <div style={card}>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <BiInput label="Section Title" value={s.title} onChange={v => set({ title: v })} placeholderEn="How It Works" placeholderBn="কিভাবে আমাদের মাধ্যমে বিজনেস করবেন" />
                    <BiInput label="Subtitle" value={s.subtitle} onChange={v => set({ subtitle: v })} placeholderEn="A simple guide to getting started" placeholderBn="শুরু করার সহজ গাইড" />
                </div>
            </div>
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Steps ({(s.steps || []).length})</h3>
                    <button onClick={add} style={btnSmall}><LuPlus size={13} /> Add Step</button>
                </div>
                {(s.steps || []).map((it: any, idx: number) => (
                    <div key={idx} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '10px', marginBottom: '8px', background: '#fafafa' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <input value={it.step || ''} onChange={e => update(idx, 'step', e.target.value)} placeholder="১" style={{ ...input, textAlign: 'center', fontWeight: 700 }} title="Step number/symbol (same both languages)" />
                            <span style={{ fontSize: '11px', color: '#666' }}>Step {idx + 1}</span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                <button onClick={() => move(idx, 'up')} disabled={idx === 0} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === 0 ? 0.3 : 1 }}><LuArrowUp size={12} /></button>
                                <button onClick={() => move(idx, 'down')} disabled={idx === s.steps.length - 1} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === s.steps.length - 1 ? 0.3 : 1 }}><LuArrowDown size={12} /></button>
                            </div>
                            <button onClick={() => remove(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <BiInput label="Step title (optional)" value={it.title} onChange={v => update(idx, 'title', v)} placeholderEn="Register" placeholderBn="রেজিস্ট্রেশন" />
                            <BiTextarea label="Step description" value={it.description} onChange={v => update(idx, 'description', v)} rows={3} placeholderEn="Explain this step in one or two lines…" placeholderBn="এক-দুই লাইনে ধাপটি বুঝিয়ে দিন…" />
                        </div>
                    </div>
                ))}
                {(s.steps || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No steps yet. Click “Add Step”.</p>}
            </div>
        </div>
    );
}

/* ─── EXPERIENCE TAB ─── */
function ExperienceSectionTab({ data, setData }: { data: any; setData: any }) {
    const s = data.experienceSection || { enabled: true, items: [] };
    const set = (patch: any) =>
        setData((p: any) => ({ ...p, experienceSection: { ...(p.experienceSection || {}), ...patch } }));
    const setItems = (items: any[]) => set({ items });

    const add = () => setItems([...(s.items || []), { icon: '✅', text: '', active: true, order: (s.items || []).length }]);
    const update = (idx: number, field: string, v: any) => {
        const items = [...s.items]; items[idx] = { ...items[idx], [field]: v }; setItems(items);
    };
    const remove = (idx: number) => setItems(s.items.filter((_: any, i: number) => i !== idx));
    const move = (idx: number, dir: 'up' | 'down') => setItems(moveItem(s.items, idx, dir));

    return (
        <div>
            <EnabledToggle enabled={s.enabled !== false} onChange={(v) => set({ enabled: v })} hint="Achievement bullets shown in the dark hero band near the bottom." />
            <div style={card}>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <BiInput label="Title" value={s.title} onChange={v => set({ title: v })} placeholderEn="Our Experience" placeholderBn="আমাদের এক্সপেরিয়েন্স" />
                    <BiTextarea label="Subtitle (paragraph)" value={s.subtitle} onChange={v => set({ subtitle: v })} rows={3} placeholderEn="What we have delivered…" placeholderBn="আমরা যা অর্জন করেছি…" />
                </div>
            </div>
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Achievement Bullets ({(s.items || []).length})</h3>
                    <button onClick={add} style={btnSmall}><LuPlus size={13} /> Add Item</button>
                </div>
                {(s.items || []).map((it: any, idx: number) => (
                    <div key={idx} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '10px', marginBottom: '8px', background: '#fafafa' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <input value={it.icon || ''} onChange={e => update(idx, 'icon', e.target.value)} placeholder="🏆" style={{ ...input, textAlign: 'center' }} />
                            <span style={{ fontSize: '11px', color: '#666' }}>Bullet {idx + 1}</span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                <button onClick={() => move(idx, 'up')} disabled={idx === 0} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === 0 ? 0.3 : 1 }}><LuArrowUp size={12} /></button>
                                <button onClick={() => move(idx, 'down')} disabled={idx === s.items.length - 1} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === s.items.length - 1 ? 0.3 : 1 }}><LuArrowDown size={12} /></button>
                            </div>
                            <button onClick={() => remove(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                        </div>
                        <BiInput label="Achievement text" value={it.text} onChange={v => update(idx, 'text', v)} placeholderEn="Achievement in English…" placeholderBn="সাফল্য বাংলায়…" />
                    </div>
                ))}
                {(s.items || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No items yet. Click “Add Item”.</p>}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ─── REVIEWS TAB ─── */
function ReviewsSectionTab({ data, setData }: { data: any; setData: any }) {
    const s = data.reviewsSection || { enabled: true, items: [] };
    const set = (patch: any) =>
        setData((p: any) => ({ ...p, reviewsSection: { ...(p.reviewsSection || {}), ...patch } }));
    const setItems = (items: any[]) => set({ items });

    const add = () => setItems([...(s.items || []), { name: '', designation: '', avatar: '', rating: 5, text: '', active: true, order: (s.items || []).length }]);
    const update = (idx: number, field: string, v: any) => {
        const items = [...s.items]; items[idx] = { ...items[idx], [field]: v }; setItems(items);
    };
    const remove = (idx: number) => setItems(s.items.filter((_: any, i: number) => i !== idx));
    const move = (idx: number, dir: 'up' | 'down') => setItems(moveItem(s.items, idx, dir));

    return (
        <div>
            <EnabledToggle enabled={s.enabled !== false} onChange={(v) => set({ enabled: v })} hint="Customer / dropshipper testimonials shown as a carousel near the bottom of the homepage." />
            <div style={card}>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <BiInput label="Section Title" value={s.title} onChange={v => set({ title: v })} placeholderEn="Dropshipper Reviews" placeholderBn="ড্রপশিপার রিভিউস" />
                    <BiTextarea label="Subtitle (paragraph)" value={s.subtitle} onChange={v => set({ subtitle: v })} rows={2} placeholderEn="What our sellers say about us…" placeholderBn="আমাদের সেলাররা আমাদের সম্পর্কে যা বলেন…" />
                </div>
            </div>
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Reviews ({(s.items || []).length})</h3>
                    <button onClick={add} style={btnSmall}><LuPlus size={13} /> Add Review</button>
                </div>
                {(s.items || []).map((it: any, idx: number) => (
                    <div key={idx} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px', marginBottom: '10px', background: '#fafafa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#666' }}>Review {idx + 1}</span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                <button onClick={() => move(idx, 'up')} disabled={idx === 0} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === 0 ? 0.3 : 1 }}><LuArrowUp size={12} /></button>
                                <button onClick={() => move(idx, 'down')} disabled={idx === s.items.length - 1} style={{ ...btnSmall, padding: '6px 8px', opacity: idx === s.items.length - 1 ? 0.3 : 1 }}><LuArrowDown size={12} /></button>
                                <button onClick={() => remove(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px', alignItems: 'start' }}>
                            <SingleImageUploader label="Photo (optional)" value={it.avatar || ''} onChange={(url: string) => update(idx, 'avatar', url)} />
                            <div style={{ display: 'grid', gap: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={label}>Name</label>
                                        <input value={it.name || ''} onChange={e => update(idx, 'name', e.target.value)} placeholder="Sobuj Akon" style={input} />
                                    </div>
                                    <div>
                                        <label style={label}>Role (optional)</label>
                                        <input value={it.designation || ''} onChange={e => update(idx, 'designation', e.target.value)} placeholder="রিসেলার" style={input} />
                                    </div>
                                </div>
                                <div>
                                    <label style={label}>Rating</label>
                                    <select value={it.rating ?? 5} onChange={e => update(idx, 'rating', Number(e.target.value))} style={input}>
                                        {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                            <label style={label}>Review text</label>
                            <textarea
                                value={it.text || ''}
                                onChange={e => update(idx, 'text', e.target.value)}
                                rows={3}
                                placeholder="What the customer said…"
                                style={{ ...input, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.55 }}
                            />
                        </div>
                    </div>
                ))}
                {(s.items || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No reviews yet. Click “Add Review”.</p>}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ─── CONTACT TAB ─── */
function ContactTab({ data, setData }: { data: any; setData: any }) {
    const c = data.contact || {};

    const updateField = (field: string, value: any) => {
        setData((p: any) => ({ ...p, contact: { ...p.contact, [field]: value } }));
    };

    const addHour = () => {
        setData((p: any) => ({ ...p, contact: { ...p.contact, hours: [...(p.contact.hours || []), { day: '', time: '' }] } }));
    };
    const removeHour = (idx: number) => {
        setData((p: any) => ({ ...p, contact: { ...p.contact, hours: p.contact.hours.filter((_: any, i: number) => i !== idx) } }));
    };
    const updateHour = (idx: number, field: string, value: string) => {
        setData((p: any) => {
            const h = [...p.contact.hours]; h[idx] = { ...h[idx], [field]: value };
            return { ...p, contact: { ...p.contact, hours: h } };
        });
    };

    const addTip = () => updateField('tips', [...(c.tips || []), '']);
    const removeTip = (idx: number) => updateField('tips', c.tips.filter((_: any, i: number) => i !== idx));
    const updateTip = (idx: number, value: string) => {
        const tips = [...c.tips]; tips[idx] = value;
        updateField('tips', tips);
    };

    const addSubject = () => updateField('subjects', [...(c.subjects || []), '']);
    const removeSubject = (idx: number) => updateField('subjects', c.subjects.filter((_: any, i: number) => i !== idx));
    const updateSubject = (idx: number, value: string) => {
        const subs = [...c.subjects]; subs[idx] = value;
        updateField('subjects', subs);
    };

    const addSocial = () => updateField('socials', [...(c.socials || []), { label: '', url: '', color: '#000000', active: true }]);
    const removeSocial = (idx: number) => updateField('socials', c.socials.filter((_: any, i: number) => i !== idx));
    const updateSocial = (idx: number, field: string, value: string | boolean) => {
        const s = [...c.socials]; s[idx] = { ...s[idx], [field]: value };
        updateField('socials', s);
    };

    return (
        <div>
            {/* Status Badge */}
            <div style={{ ...card, background: 'var(--color-primary-lightest)', borderColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LuCircleCheck size={16} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>Active — This data is used on the <strong>Contact Us</strong> page</span>
                </div>
            </div>

            {/* Basic Info */}
            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px' }}>Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={label}>Phone Number</label><input value={c.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="01921714797" style={input} /></div>
                    <div><label style={label}>WhatsApp Number</label><input value={c.whatsapp || ''} onChange={e => updateField('whatsapp', e.target.value)} placeholder="01921714797" style={input} /></div>
                    <div><label style={label}>Email</label><input value={c.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="RISGROUP21BD@GMAIL.COM" style={input} /></div>
                    <div><label style={label}>Address</label><input value={c.address || ''} onChange={e => updateField('address', e.target.value)} placeholder="Bagerhat, Sharankhola Upazila, Bangladesh" style={input} /></div>
                </div>
            </div>

            {/* Business Hours */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Business Hours</h3>
                    <button onClick={addHour} style={btnSmall}><LuPlus size={13} /> Add</button>
                </div>
                {(c.hours || []).map((h: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input value={h.day} onChange={e => updateHour(idx, 'day', e.target.value)} placeholder="Day (e.g. Sunday – Thursday)" style={{ ...input, flex: 1 }} />
                        <input value={h.time} onChange={e => updateHour(idx, 'time', e.target.value)} placeholder="Time (e.g. 9 AM – 6 PM)" style={{ ...input, flex: 1 }} />
                        <button onClick={() => removeHour(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                    </div>
                ))}
                {(c.hours || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No hours added yet.</p>}
            </div>

            {/* Subjects */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Form Subjects</h3>
                    <button onClick={addSubject} style={btnSmall}><LuPlus size={13} /> Add</button>
                </div>
                {(c.subjects || []).map((s: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input value={s} onChange={e => updateSubject(idx, e.target.value)} placeholder="Subject option..." style={{ ...input, flex: 1 }} />
                        <button onClick={() => removeSubject(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                    </div>
                ))}
                {(c.subjects || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No subjects added yet.</p>}
            </div>

            {/* Tips */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Quick Tips</h3>
                    <button onClick={addTip} style={btnSmall}><LuPlus size={13} /> Add</button>
                </div>
                {(c.tips || []).map((t: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input value={t} onChange={e => updateTip(idx, e.target.value)} placeholder="Tip text..." style={{ ...input, flex: 1 }} />
                        <button onClick={() => removeTip(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                    </div>
                ))}
                {(c.tips || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No tips added yet.</p>}
            </div>

            {/* Social Links */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Social Links</h3>
                    <button onClick={addSocial} style={btnSmall}><LuPlus size={13} /> Add</button>
                </div>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px' }}>
                    Only links marked <strong>Active</strong> appear in the footer (under the logo) — a link stays visible when it&apos;s active even if the URL is still blank. Toggle a link off to hide it.
                </p>
                {(c.socials || []).map((s: any, idx: number) => {
                    const isOn = s.active !== false;
                    return (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        {/* Active toggle — the single source of truth for footer visibility. */}
                        <button
                            onClick={() => updateSocial(idx, 'active', !isOn)}
                            title={isOn ? 'Active — showing in footer' : 'Hidden'}
                            style={{
                                ...btn,
                                padding: '6px 10px',
                                background: isOn ? 'var(--color-primary-lightest)' : '#f3f4f6',
                                color: isOn ? '#16a34a' : '#9ca3af',
                                border: `1px solid ${isOn ? '#bbf7d0' : '#e5e7eb'}`,
                                minWidth: '82px',
                                justifyContent: 'center',
                            }}
                        >
                            {isOn ? '● Active' : '○ Hidden'}
                        </button>
                        <input value={s.label} onChange={e => updateSocial(idx, 'label', e.target.value)} placeholder="Label (e.g. Facebook)" style={{ ...input, width: '140px' }} />
                        <input value={s.url} onChange={e => updateSocial(idx, 'url', e.target.value)} placeholder="URL (optional)" style={{ ...input, flex: 1 }} />
                        <input type="color" value={s.color} onChange={e => updateSocial(idx, 'color', e.target.value)} style={{ width: '36px', height: '32px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                        <button onClick={() => removeSocial(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                    </div>
                    );
                })}
                {(c.socials || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No socials added yet.</p>}
            </div>
        </div>
    );
}

/* ─── FLOATING TAB ─── */
function FloatingTab({ data, setData }: { data: any; setData: any }) {
    const f = data.floating || {};
    const update = (field: string, value: any) => setData((p: any) => ({ ...p, floating: { ...p.floating, [field]: value } }));

    return (
        <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Floating Contact Widget</h3>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>Manage the floating WhatsApp/Messenger/Phone button that appears on every page.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                    <label style={label}>Phone Number</label>
                    <input value={f.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="01921714797" style={input} />
                </div>
                <div>
                    <label style={label}>Show Phone</label>
                    <select value={f.showPhone ? 'true' : 'false'} onChange={e => update('showPhone', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
                <div>
                    <label style={label}>WhatsApp Number (with country code)</label>
                    <input value={f.whatsapp || ''} onChange={e => update('whatsapp', e.target.value)} placeholder="8801921714797" style={input} />
                </div>
                <div>
                    <label style={label}>Show WhatsApp</label>
                    <select value={f.showWhatsapp ? 'true' : 'false'} onChange={e => update('showWhatsapp', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
                <div>
                    <label style={label}>Messenger Page Username</label>
                    <input value={f.messenger || ''} onChange={e => update('messenger', e.target.value)} placeholder="YOUR_PAGE_USERNAME" style={input} />
                </div>
                <div>
                    <label style={label}>Show Messenger</label>
                    <select value={f.showMessenger ? 'true' : 'false'} onChange={e => update('showMessenger', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

/* ─── PAYMENT TAB ─── */
function PaymentTab({ data, setData }: { data: any; setData: any }) {
    const methods = [
        { key: 'bkash', label: 'bKash', color: '#E2136E' },
        { key: 'rocket', label: 'Rocket', color: '#8332AC' },
        { key: 'nagad', label: 'Nagad', color: '#F47920' },
        { key: 'cod', label: 'Cash on Delivery', color: '#16a34a' },
    ];

    const p = data.payment || {};
    const updateMethod = (method: string, field: string, value: any) => {
        setData((prev: any) => ({
            ...prev,
            payment: {
                ...prev.payment,
                [method]: { ...(prev.payment?.[method] || {}), [field]: value },
            },
        }));
    };
    const updateInstructions = (value: string) => {
        setData((prev: any) => ({ ...prev, payment: { ...prev.payment, instructions: value } }));
    };

    return (
        <div>
            {/* Info */}
            <div style={{ ...card, background: 'var(--color-primary-lightest)', borderColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LuCircleCheck size={16} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>
                        These numbers appear on the <strong>Checkout</strong> page. Customers send money to the active number.
                    </span>
                </div>
            </div>

            {/* Method cards */}
            {methods.map(m => {
                const md = p[m.key] || {};
                const isCOD = m.key === 'cod';
                return (
                    <div key={m.key} style={{ ...card, borderLeft: `3px solid ${m.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isCOD ? 0 : '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: m.color }} />
                                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: m.color }}>{m.label}</h3>
                                {isCOD && <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>— no payment number needed</span>}
                            </div>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#555', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={md.active !== false}
                                    onChange={e => updateMethod(m.key, 'active', e.target.checked)}
                                    style={{ width: '15px', height: '15px', accentColor: m.color, cursor: 'pointer' }}
                                />
                                {md.active !== false ? 'Active' : 'Hidden'}
                            </label>
                        </div>
                        {!isCOD && (
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={label}>{m.label} Number</label>
                                    <input
                                        value={md.number || ''}
                                        onChange={e => updateMethod(m.key, 'number', e.target.value)}
                                        placeholder="01XXXXXXXXX"
                                        style={input}
                                    />
                                </div>
                                <div>
                                    <label style={label}>Account Type</label>
                                    <select
                                        value={md.accountType || 'Personal'}
                                        onChange={e => updateMethod(m.key, 'accountType', e.target.value)}
                                        style={input}
                                    >
                                        <option value="Personal">Personal</option>
                                        <option value="Agent">Agent</option>
                                        <option value="Merchant">Merchant</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Instructions */}
            <div style={card}>
                <label style={label}>Payment Instructions (shown to customer)</label>
                <textarea
                    value={p.instructions || ''}
                    onChange={e => updateInstructions(e.target.value)}
                    placeholder="e.g. Send Money to the number above, then submit your number, transaction ID and time."
                    rows={2}
                    style={{ ...input, resize: 'vertical' as const, fontFamily: 'inherit' }}
                />
            </div>
        </div>
    );
}

/* ─── FOOTER TAB ─── */
function FooterTab({ data, setData }: { data: any; setData: any }) {
    const f = data.footer || {};
    const update = (field: string, value: any) => setData((p: any) => ({ ...p, footer: { ...p.footer, [field]: value } }));

    return (
        <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Footer Settings</h3>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>Manage footer text displayed at the bottom of every page.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={label}>Company Name</label><input value={f.companyName || ''} onChange={e => update('companyName', e.target.value)} style={input} /></div>
                <div><label style={label}>Copyright Text (optional)</label><input value={f.copyright || ''} onChange={e => update('copyright', e.target.value)} placeholder="Leave empty for auto year" style={input} /></div>
            </div>
        </div>
    );
}

/* ─── LEGAL PAGES TAB ─── */
function LegalPagesTab() {
    const { data: legalRes, isLoading } = useGetAllLegalPagesQuery({});
    const [updateLegalPage, { isLoading: isSavingLegal }] = useUpdateLegalPageMutation();
    const [editingSlug, setEditingSlug] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const pages = legalRes?.data || [];

    const LEGAL_PAGES = [
        { slug: 'terms', label: 'Terms & Conditions', icon: '📜', color: 'var(--color-primary)' },
        { slug: 'privacy', label: 'Privacy Policy', icon: '🛡️', color: '#2563eb' },
        { slug: 'refund', label: 'Refund Policy', icon: '🔄', color: '#d97706' },
    ];

    const startEdit = (slug: string) => {
        const page = pages.find((p: any) => p.slug === slug);
        setEditingSlug(slug);
        setEditTitle(page?.title || LEGAL_PAGES.find(l => l.slug === slug)?.label || '');
        setEditContent(page?.content || '');
    };

    const handleSaveLegal = async () => {
        if (!editingSlug) return;
        try {
            await updateLegalPage({ slug: editingSlug, data: { title: editTitle, content: editContent } }).unwrap();
            toast.success(`${editTitle} saved!`);
            setEditingSlug(null);
        } catch {
            toast.error('Failed to save');
        }
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
        );
    }

    // Editing Mode
    if (editingSlug) {
        const meta = LEGAL_PAGES.find(l => l.slug === editingSlug);
        return (
            <div>
                <div style={{ ...card, borderColor: meta?.color + '40' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '20px' }}>{meta?.icon}</span>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Editing: {meta?.label}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setEditingSlug(null)} style={{ ...btn, background: '#f3f4f6', color: '#555' }}>Cancel</button>
                            <button onClick={handleSaveLegal} disabled={isSavingLegal} style={{ ...btnPrimary, opacity: isSavingLegal ? 0.6 : 1 }}>
                                <LuSave size={13} /> {isSavingLegal ? 'Saving...' : 'Save Page'}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={label}>Page Title</label>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={input} placeholder="Page title..." />
                    </div>

                    <div>
                        <label style={label}>Page Content</label>
                        <div className="legal-editor-wrapper" style={{ background: '#fff', borderRadius: '8px', border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
                            <ReactQuill
                                theme="snow"
                                value={editContent}
                                onChange={(value: string) => setEditContent(value)}
                                placeholder="Write your page content here..."
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                        [{ 'font': [] }],
                                        [{ 'size': ['small', false, 'large', 'huge'] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                                        [{ 'align': [] }],
                                        ['link', 'image', 'video'],
                                        ['blockquote', 'code-block'],
                                        ['clean'],
                                    ],
                                }}
                                style={{ minHeight: '400px' }}
                            />
                        </div>
                        <style>{`
                            .legal-editor-wrapper .ql-toolbar { border: none !important; border-bottom: 1px solid #e5e7eb !important; background: #f9fafb; padding: 10px 12px !important; }
                            .legal-editor-wrapper .ql-container { border: none !important; font-size: 14px; font-family: inherit; }
                            .legal-editor-wrapper .ql-editor { min-height: 400px; padding: 20px 24px; line-height: 1.8; }
                            .legal-editor-wrapper .ql-editor h1 { font-size: 22px; font-weight: 800; margin: 20px 0 10px; }
                            .legal-editor-wrapper .ql-editor h2 { font-size: 18px; font-weight: 700; margin: 18px 0 8px; }
                            .legal-editor-wrapper .ql-editor h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; }
                            .legal-editor-wrapper .ql-editor p { margin-bottom: 10px; }
                            .legal-editor-wrapper .ql-editor img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
                        `}</style>
                    </div>
                </div>
            </div>
        );
    }

    // List Mode
    return (
        <div>
            <div style={{ ...card, background: 'var(--color-primary-surface)', borderColor: '#bbf7d0' }}>
                <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, margin: 0 }}>
                    ✅ These pages are live at: <strong>/terms</strong>, <strong>/privacy</strong>, <strong>/refund</strong>
                </p>
            </div>
            {LEGAL_PAGES.map(lp => {
                const page = pages.find((p: any) => p.slug === lp.slug);
                const hasContent = page?.content && page.content.length > 10;
                return (
                    <div key={lp.slug} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{lp.icon}</span>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 2px', color: '#111' }}>{lp.label}</h4>
                                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
                                    {hasContent ? `${page.content.replace(/<[^>]+>/g, '').substring(0, 80)}...` : 'No content yet'}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                                background: hasContent ? 'var(--color-primary-lightest)' : '#fef2f2',
                                color: hasContent ? '#16a34a' : '#dc2626',
                                textTransform: 'uppercase',
                            }}>
                                {hasContent ? 'Published' : 'Empty'}
                            </span>
                            <button onClick={() => startEdit(lp.slug)} style={{ ...btnSmall, fontWeight: 700 }}>
                                ✏️ Edit
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── HERO SLIDES TAB ─── */
function HeroSlidesTab({ data, setData, onSave, isSaving }: { data: any; setData: any; onSave: () => void; isSaving: boolean }) {
    const slides = data.heroSlides || [];

    // The homepage carousel re-sorts slides by their numeric `order`, so every mutation
    // must renumber `order` to match the array position — otherwise reordering/removal
    // saves fine but the live homepage restores the original sequence.
    const renumber = (arr: any[]) => arr.map((s: any, i: number) => ({ ...s, order: i }));
    const commit = (arr: any[]) => setData((p: any) => ({ ...p, heroSlides: renumber(arr) }));

    const addSlide = (imageUrl: string) => {
        if (!imageUrl) return;
        commit([...slides, { imageUrl, active: true }]);
    };

    // Bulk-add: append every uploaded image as a new slide.
    const addSlides = (urls: string[]) => {
        const clean = (urls || []).filter(Boolean);
        if (!clean.length) return;
        commit([...slides, ...clean.map((imageUrl) => ({ imageUrl, active: true }))]);
    };

    const updateSlide = (idx: number, field: string, value: any) => {
        commit(slides.map((s: any, i: number) => (i === idx ? { ...s, [field]: value } : s)));
    };

    // Mid-page promo banner — a single object, saved alongside the slides.
    const banner = data.homeBanner || {};
    const updateBanner = (field: string, value: any) => {
        setData((p: any) => ({ ...p, homeBanner: { ...(p.homeBanner || {}), [field]: value } }));
    };

    const removeSlide = (idx: number) => {
        commit(slides.filter((_: any, i: number) => i !== idx));
    };

    const moveSlide = (idx: number, direction: 'up' | 'down') => {
        const newSlides = [...slides];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= newSlides.length) return;
        [newSlides[idx], newSlides[swapIdx]] = [newSlides[swapIdx], newSlides[idx]];
        commit(newSlides);
    };

    const handleSaveHero = async () => {
        // Update heroSlides in formData then trigger parent save
        onSave();
    };

    return (
        <div>
            {/* Info */}
            <div style={{ ...card, background: '#fffbeb', borderColor: '#fde68a' }}>
                <p style={{ fontSize: '12px', color: '#b45309', fontWeight: 600, margin: 0 }}>
                    🖼️ Hero slides appear at the top of your homepage as a banner carousel. Add multiple images and they will auto-rotate.
                    Recommended size <strong>1920 × 540</strong>. Headline / sub-text / button are drawn as live text over the banner —
                    set <strong>Text: Left / Right</strong> to match the empty side of your artwork, and leave the text fields blank
                    if the image already has its own wording baked in.
                </p>
            </div>

            {/* Current Slides */}
            {slides.length > 0 && (
                <div style={{ ...card }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px' }}>Current Slides ({slides.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                        {slides.map((slide: any, idx: number) => (
                            <div key={idx} style={{
                                position: 'relative', borderRadius: '10px', overflow: 'hidden',
                                border: '1px solid #e5e7eb', background: '#f9fafb',
                            }}>
                                <img
                                    src={slide.imageUrl}
                                    alt={`Slide ${idx + 1}`}
                                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                />
                                {/* Live text overlay — leave every field blank for a banner
                                    whose artwork already carries its own wording. */}
                                <div style={{ padding: '8px 8px 0', display: 'grid', gap: '6px' }}>
                                    <input
                                        value={slide.title || ''}
                                        onChange={e => updateSlide(idx, 'title', e.target.value)}
                                        placeholder="Headline (optional)"
                                        style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                    />
                                    <input
                                        value={slide.subtitle || ''}
                                        onChange={e => updateSlide(idx, 'subtitle', e.target.value)}
                                        placeholder="Sub-text (optional)"
                                        style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <input
                                            value={slide.ctaLabel || ''}
                                            onChange={e => updateSlide(idx, 'ctaLabel', e.target.value)}
                                            placeholder="Button text"
                                            style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                        />
                                        <input
                                            value={slide.ctaHref || ''}
                                            onChange={e => updateSlide(idx, 'ctaHref', e.target.value)}
                                            placeholder="/products"
                                            style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <select
                                            value={slide.align || 'left'}
                                            onChange={e => updateSlide(idx, 'align', e.target.value)}
                                            style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                            title="Which side of the artwork the text sits on"
                                        >
                                            <option value="left">Text: Left</option>
                                            <option value="center">Text: Center</option>
                                            <option value="right">Text: Right</option>
                                        </select>
                                        <select
                                            value={slide.textTone || 'light'}
                                            onChange={e => updateSlide(idx, 'textTone', e.target.value)}
                                            style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                            title="Use light text on dark banners"
                                        >
                                            <option value="light">Light text</option>
                                            <option value="dark">Dark text</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#555' }}>Slide {idx + 1}</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => moveSlide(idx, 'up')}
                                            disabled={idx === 0}
                                            style={{ ...btnSmall, padding: '4px 6px', opacity: idx === 0 ? 0.3 : 1 }}
                                            title="Move Up"
                                        >
                                            <LuArrowUp size={12} />
                                        </button>
                                        <button
                                            onClick={() => moveSlide(idx, 'down')}
                                            disabled={idx === slides.length - 1}
                                            style={{ ...btnSmall, padding: '4px 6px', opacity: idx === slides.length - 1 ? 0.3 : 1 }}
                                            title="Move Down"
                                        >
                                            <LuArrowDown size={12} />
                                        </button>
                                        <button
                                            onClick={() => removeSlide(idx)}
                                            style={{ ...btnSmall, padding: '4px 6px', background: '#fef2f2', color: '#dc2626' }}
                                            title="Delete"
                                        >
                                            <LuTrash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add New Slides — upload one or many at once */}
            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Add Banner Images</h3>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px' }}>
                    Select <strong>one or more</strong> images at once — each becomes a slide that auto-rotates on the homepage. You can reorder or remove them above, and change them anytime.
                </p>
                <div style={{
                    fontSize: '12px', color: '#b45309', fontWeight: 700, margin: '0 0 14px',
                    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px',
                }}>
                    📐 Recommended banner size: <strong>1920 × 540 px</strong> (16 : 4.5 ratio, wide &amp; short) &nbsp;·&nbsp; JPG / PNG / WebP &nbsp;·&nbsp; under 10&nbsp;MB each.
                    <br />Design all banners at this exact size so every slide looks sharp and aligned.
                </div>
                <MultipleImageUploader
                    label="Banner Images"
                    values={[]}
                    onChange={(urls) => addSlides(urls)}
                    max={10}
                />
            </div>

            {/* ── Mid-page promo banner ── */}
            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>🎯 Homepage Promo Banner</h3>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px' }}>
                    A single wide banner shown on the homepage <strong>between “Popular Products” and “New Arrivals”</strong>.
                    Leave the image empty (or switch it off) to hide the section entirely. Same recommended size — <strong>1920 × 540 px</strong>.
                </p>

                <div style={{ display: 'grid', gap: '10px' }}>
                    <SingleImageUploader
                        label="Banner Image"
                        value={banner.imageUrl || ''}
                        onChange={(url: string) => updateBanner('imageUrl', url)}
                    />

                    {banner.imageUrl && (
                        <img
                            src={banner.imageUrl}
                            alt="Promo banner preview"
                            style={{ width: '100%', maxHeight: '130px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={label}>Show on homepage</label>
                            <select
                                value={banner.active === false ? 'false' : 'true'}
                                onChange={e => updateBanner('active', e.target.value === 'true')}
                                style={input}
                            >
                                <option value="true">Yes — visible</option>
                                <option value="false">No — hidden</option>
                            </select>
                        </div>
                        <div>
                            <label style={label}>Click goes to</label>
                            <input
                                value={banner.link || ''}
                                onChange={e => updateBanner('link', e.target.value)}
                                placeholder="/products"
                                style={input}
                            />
                        </div>
                    </div>

                    <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>
                        Text below is optional — leave blank if your artwork already has its own wording.
                    </p>

                    <div><label style={label}>Headline</label>
                        <input value={banner.title || ''} onChange={e => updateBanner('title', e.target.value)} style={input} /></div>
                    <div><label style={label}>Sub-text</label>
                        <input value={banner.subtitle || ''} onChange={e => updateBanner('subtitle', e.target.value)} style={input} /></div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div><label style={label}>Button text</label>
                            <input value={banner.ctaLabel || ''} onChange={e => updateBanner('ctaLabel', e.target.value)} style={input} /></div>
                        <div>
                            <label style={label}>Text side</label>
                            <select value={banner.align || 'left'} onChange={e => updateBanner('align', e.target.value)} style={input}>
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>
                        <div>
                            <label style={label}>Text colour</label>
                            <select value={banner.textTone || 'light'} onChange={e => updateBanner('textTone', e.target.value)} style={input}>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={handleSaveHero} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.6 : 1 }}>
                    <LuSave size={13} /> {isSaving ? 'Saving...' : 'Save Banners'}
                </button>
            </div>
        </div>
    );
}
