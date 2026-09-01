"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LuArrowLeft, LuCheck, LuLoaderCircle, LuSend, LuUser, LuPhone, LuMapPin, LuMessageSquare } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useCreateOrderRequestMutation } from '@/redux/api/orderRequestApi';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { pickText } from '@/lib/i18n/text';
import AreaSelect, { AreaValue } from '@/components/shared/AreaSelect';

const inputCls =
    'w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15';

const ServiceRequestInner: React.FC = () => {
    const params = useSearchParams();
    const { lang } = useLanguage();
    const isBn = lang === 'bn';

    const idxRaw = params.get('service');
    const idx = idxRaw !== null && idxRaw !== '' ? Number(idxRaw) : NaN;

    const { data } = useGetSiteContentQuery(undefined);
    const services = ((data?.data?.servicesSection?.items) || [])
        .filter((it: any) => it.active !== false)
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    const service = Number.isFinite(idx) ? services[idx] : null;
    const serviceTitle = service ? pickText(service.title, lang) : '';

    const [createReq, { isLoading }] = useCreateOrderRequestMutation();
    const [form, setForm] = useState({ name: '', phone: '', address: '', message: '' });
    const [area, setArea] = useState<AreaValue>({});
    const [done, setDone] = useState(false);

    const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error(isBn ? 'আপনার নাম দিন' : 'Enter your name'); return; }
        if (!form.phone.trim()) { toast.error(isBn ? 'ফোন নম্বর দিন' : 'Enter your phone number'); return; }
        if (!area.upazila) { toast.error(isBn ? 'আপনার এলাকা (উপজেলা) বেছে নিন' : 'Select your area (upazila)'); return; }
        try {
            await createReq({
                serviceTitle,
                serviceIndex: Number.isFinite(idx) ? idx : null,
                name: form.name.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                message: form.message.trim(),
                division: area.division,
                district: area.district,
                upazila: area.upazila,
            }).unwrap();
            setDone(true);
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not send your request. Please try again.');
        }
    };

    if (done) {
        return (
            <div className="container mx-auto px-4 py-12 sm:py-16">
                <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                        <LuCheck size={32} />
                    </div>
                    <h1 className="text-xl font-extrabold text-gray-900">{isBn ? 'রিকোয়েস্ট পাঠানো হয়েছে!' : 'Request sent!'}</h1>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        {isBn
                            ? 'আপনার এলাকার প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন। ধন্যবাদ।'
                            : 'Our representative for your area will contact you soon. Thank you.'}
                    </p>
                    <Link href="/" className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors">
                        {isBn ? 'হোমে ফিরে যান' : 'Back to home'}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="max-w-xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[var(--color-primary)] mb-4">
                    <LuArrowLeft size={16} /> {isBn ? 'হোম' : 'Home'}
                </Link>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                    <div className="mb-6">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-primary)]">
                            {isBn ? 'সার্ভিস রিকোয়েস্ট' : 'Service Request'}
                        </p>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1 leading-tight">
                            {serviceTitle || (isBn ? 'আপনার প্রয়োজন জানান' : 'Tell us what you need')}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1.5">
                            {isBn
                                ? 'নিচের তথ্য দিন — আপনার এলাকার প্রতিনিধি যোগাযোগ করবেন।'
                                : 'Fill in your details and our area representative will reach out.'}
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{isBn ? 'আপনার নাম' : 'Your name'} *</label>
                            <div className="relative">
                                <LuUser size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder={isBn ? 'নাম' : 'Full name'} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{isBn ? 'ফোন নম্বর' : 'Phone number'} *</label>
                            <div className="relative">
                                <LuPhone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="01XXXXXXXXX" inputMode="tel" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{isBn ? 'আপনার এলাকা' : 'Your area'} *</label>
                            <AreaSelect value={area} onChange={setArea} bangla={isBn} />
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{isBn ? 'বিস্তারিত ঠিকানা (ঐচ্ছিক)' : 'Full address (optional)'}</label>
                            <div className="relative">
                                <LuMapPin size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputCls} placeholder={isBn ? 'গ্রাম / রোড / বাসা' : 'Village / road / house'} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{isBn ? 'আপনার প্রয়োজন লিখুন (ঐচ্ছিক)' : 'What do you need? (optional)'}</label>
                            <div className="relative">
                                <LuMessageSquare size={17} className="absolute left-3.5 top-3 text-slate-400" />
                                <textarea
                                    value={form.message}
                                    onChange={(e) => set('message', e.target.value)}
                                    rows={3}
                                    className={`${inputCls} !py-3 resize-none`}
                                    placeholder={isBn ? 'কী কী লাগবে, পরিমাণ ইত্যাদি...' : 'Items, quantity, details...'}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:translate-y-0"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}
                        >
                            {isLoading ? <LuLoaderCircle size={18} className="animate-spin" /> : <LuSend size={17} />}
                            {isBn ? 'রিকোয়েস্ট পাঠান' : 'Send request'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ServiceRequestPage = () => (
    <Suspense fallback={<div className="p-16 text-center text-[var(--color-primary)]">Loading…</div>}>
        <ServiceRequestInner />
    </Suspense>
);

export default ServiceRequestPage;
