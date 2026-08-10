"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    LuPlus, LuSearch, LuX, LuPackage, LuPencil, LuTrash2, LuUpload,
    LuTriangleAlert, LuCircleCheck, LuClock, LuCircleX, LuBuilding2,
    LuImage, LuLoader, LuChevronLeft, LuChevronRight,
} from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '@/redux';
import {
    useGetMyCompanyProductsQuery,
    useCreateMyCompanyProductMutation,
    useUpdateMyCompanyProductMutation,
    useDeleteMyCompanyProductMutation,
} from '@/redux/api/companyApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useUploadMyImagesMutation } from '@/redux/api/uploadApi';

const LIMIT = 12;

const UNITS = ['piece', 'kg', 'gram', 'liter', 'pack', 'pair', 'box', 'dozen', 'set', 'bag'];

const inputCls =
    'w-full text-sm px-3.5 py-3 rounded-xl border border-gray-200 bg-white outline-none ' +
    'placeholder:text-gray-400 transition-colors focus:border-[var(--color-primary)] ' +
    'focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5';
const errCls = 'text-xs text-red-500 mt-1.5';

const taka = (n: unknown) => `৳${Number(n || 0).toLocaleString()}`;

interface Category { _id: string; name: string; parent?: string | null }

interface Product {
    _id: string;
    name: string;
    description?: string;
    thumbnail?: string;
    images?: string[];
    price?: number;
    originalPrice?: number | null;
    wholesalePrice?: number;
    moq?: number;
    stock?: number;
    unit?: string;
    brand?: string;
    tags?: string[];
    status?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    approvalNote?: string;
    category?: { _id: string; name: string } | string | null;
}

type FormState = {
    name: string;
    description: string;
    price: string;
    originalPrice: string;
    wholesalePrice: string;
    moq: string;
    stock: string;
    unit: string;
    category: string;
    thumbnail: string;
    images: string[];
    brand: string;
    tags: string;
};

const emptyForm: FormState = {
    name: '', description: '', price: '', originalPrice: '', wholesalePrice: '',
    moq: '1', stock: '0', unit: 'piece', category: '', thumbnail: '', images: [],
    brand: '', tags: '',
};

const APPROVAL_PILL = {
    approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700', icon: LuCircleCheck },
    pending: { label: 'Pending review', cls: 'bg-amber-50 text-amber-700', icon: LuClock },
    rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700', icon: LuCircleX },
} as const;

const ApprovalPill = ({ status }: { status?: string }) => {
    const cfg = APPROVAL_PILL[(status || 'pending') as keyof typeof APPROVAL_PILL] || APPROVAL_PILL.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.cls}`}>
            <Icon size={12} /> {cfg.label}
        </span>
    );
};

const categoryId = (c: Product['category']) =>
    (typeof c === 'object' && c ? c._id : (c as string)) || '';

export default function CompanyProductsPage() {
    const { user, isAuthenticated } = useAppSelector((s) => s.auth);
    const role = user?.role as string | undefined;

    const [approvalStatus, setApprovalStatus] = useState('');
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

    const thumbRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);

    // Typing must not fire a request per keystroke — these users are on mobile data.
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { setPage(1); }, [debouncedSearch, approvalStatus, status]);

    const isCompany = role === 'company';

    const { data, isLoading, isFetching } = useGetMyCompanyProductsQuery(
        {
            approvalStatus: approvalStatus || undefined,
            status: status || undefined,
            q: debouncedSearch || undefined,
            page,
            limit: LIMIT,
        },
        { skip: !isCompany }
    );
    const { data: catRes } = useGetCategoriesQuery({ limit: 200 }, { skip: !isCompany });

    const [createProduct, { isLoading: creating }] = useCreateMyCompanyProductMutation();
    const [updateProduct, { isLoading: updating }] = useUpdateMyCompanyProductMutation();
    const [deleteProduct, { isLoading: deleting }] = useDeleteMyCompanyProductMutation();
    const [uploadImages, { isLoading: uploading }] = useUploadMyImagesMutation();

    const products: Product[] = data?.data?.products || [];
    const meta = data?.data?.meta || { total: 0, totalPages: 1 };
    const categories: Category[] = catRes?.data || [];

    const saving = creating || updating;

    // The panel is company-only, but a page must never render blank for anyone
    // who lands on the URL directly.
    if (!isAuthenticated || !isCompany) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.08)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                    <LuBuilding2 size={24} />
                </div>
                <h1 className="text-lg font-extrabold text-gray-900">Company account required</h1>
                <p className="text-sm text-gray-500 leading-relaxed mt-2">
                    Only approved supplier companies can manage a catalogue here.
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

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setModalOpen(true);
    };

    const openEdit = (p: Product) => {
        setEditing(p);
        setForm({
            name: p.name || '',
            description: p.description || '',
            price: p.price != null ? String(p.price) : '',
            originalPrice: p.originalPrice != null ? String(p.originalPrice) : '',
            wholesalePrice: p.wholesalePrice != null ? String(p.wholesalePrice) : '',
            moq: p.moq != null ? String(p.moq) : '1',
            stock: p.stock != null ? String(p.stock) : '0',
            unit: p.unit || 'piece',
            category: categoryId(p.category),
            thumbnail: p.thumbnail || '',
            images: p.images || [],
            brand: p.brand || '',
            tags: (p.tags || []).join(', '),
        });
        setErrors({});
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving || uploading) return;
        setModalOpen(false);
        setEditing(null);
    };

    /** Upload through /upload/my-images — the one upload route a company may call. */
    const uploadFiles = async (files: FileList | null, max: number): Promise<string[]> => {
        if (!files || files.length === 0) return [];
        const chosen = Array.from(files).slice(0, max);
        for (const f of chosen) {
            if (!f.type.startsWith('image/')) { toast.error('Please choose image files only'); return []; }
            if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} is over 5MB`); return []; }
        }
        const fd = new FormData();
        chosen.forEach((f) => fd.append('images', f));
        try {
            const res = await uploadImages(fd).unwrap();
            return res.data.urls || [];
        } catch {
            toast.error('Upload failed. Try again.');
            return [];
        }
    };

    const handleThumb = async (files: FileList | null) => {
        const urls = await uploadFiles(files, 1);
        if (urls[0]) {
            set('thumbnail', urls[0]);
            toast.success('Main photo uploaded');
        }
        if (thumbRef.current) thumbRef.current.value = '';
    };

    const handleGallery = async (files: FileList | null) => {
        const room = 5 - form.images.length;
        if (room <= 0) { toast.error('Up to 5 extra photos'); return; }
        const urls = await uploadFiles(files, room);
        if (urls.length) {
            setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, 5) }));
            toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} added`);
        }
        if (galleryRef.current) galleryRef.current.value = '';
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Product name is required';
        if (!form.description.trim()) e.description = 'Description is required';
        if (!form.price || Number(form.price) <= 0) e.price = 'Enter a retail price';
        if (form.originalPrice && Number(form.originalPrice) < Number(form.price)) {
            e.originalPrice = 'The old price should be higher than the selling price';
        }
        if (!form.category) e.category = 'Pick a category';
        if (!form.thumbnail) e.thumbnail = 'A main photo is required';
        if (form.moq && Number(form.moq) < 1) e.moq = 'Minimum 1';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /** The full form as the API wants it. */
    const payloadOf = (f: FormState): Record<string, unknown> => ({
        name: f.name.trim(),
        description: f.description.trim(),
        price: Number(f.price),
        originalPrice: f.originalPrice ? Number(f.originalPrice) : null,
        wholesalePrice: f.wholesalePrice ? Number(f.wholesalePrice) : 0,
        moq: f.moq ? Number(f.moq) : 1,
        stock: f.stock ? Number(f.stock) : 0,
        unit: f.unit,
        category: f.category,
        thumbnail: f.thumbnail,
        images: f.images,
        brand: f.brand.trim(),
        tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const full = payloadOf(form);

        try {
            if (editing) {
                // Send only what actually changed. The server keeps an approved
                // product live when the patch touches nothing but stock — sending
                // the whole form every time would send it back for review over a
                // stock correction.
                const before = payloadOf({
                    name: editing.name || '',
                    description: editing.description || '',
                    price: editing.price != null ? String(editing.price) : '',
                    originalPrice: editing.originalPrice != null ? String(editing.originalPrice) : '',
                    wholesalePrice: editing.wholesalePrice != null ? String(editing.wholesalePrice) : '',
                    moq: editing.moq != null ? String(editing.moq) : '1',
                    stock: editing.stock != null ? String(editing.stock) : '0',
                    unit: editing.unit || 'piece',
                    category: categoryId(editing.category),
                    thumbnail: editing.thumbnail || '',
                    images: editing.images || [],
                    brand: editing.brand || '',
                    tags: (editing.tags || []).join(', '),
                });

                const patch: Record<string, unknown> = {};
                Object.keys(full).forEach((k) => {
                    if (JSON.stringify(full[k]) !== JSON.stringify(before[k])) patch[k] = full[k];
                });

                if (Object.keys(patch).length === 0) {
                    toast('Nothing changed');
                    closeModal();
                    return;
                }

                await updateProduct({ id: editing._id, data: patch }).unwrap();
                const stockOnly = Object.keys(patch).every((k) => k === 'stock');
                toast.success(
                    stockOnly
                        ? 'Stock updated — your product stays live'
                        : 'Product updated — it goes back for review'
                );
            } else {
                await createProduct(full).unwrap();
                toast.success('Product submitted — it goes live once approved');
            }
            setModalOpen(false);
            setEditing(null);
        } catch (err) {
            toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not save the product');
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteProduct(confirmDelete._id).unwrap();
            toast.success('Product removed');
            setConfirmDelete(null);
        } catch (err) {
            toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not remove the product');
        }
    };

    const hasFilters = Boolean(debouncedSearch || approvalStatus || status);
    const clearFilters = () => { setSearch(''); setDebouncedSearch(''); setApprovalStatus(''); setStatus(''); };

    const chipCls = (active: boolean) =>
        `px-3.5 min-h-[38px] inline-flex items-center gap-1.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-colors ${
            active
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[rgba(var(--color-primary-rgb),0.35)]'
        }`;

    const rootCategories = categories.filter((c) => !c.parent);
    const childCategories = categories.filter((c) => c.parent);

    return (
        <div className="space-y-4">

            {/* ── Header ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">My products</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        {meta.total} product{meta.total === 1 ? '' : 's'} in your catalogue
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 px-5 min-h-[46px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold shadow-md shadow-[rgba(var(--color-primary-rgb),0.25)] hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                    <LuPlus size={17} /> Add product
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 sm:p-4 space-y-3">
                <div className="relative">
                    <LuSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search your products by name..."
                        aria-label="Search products"
                        className="w-full min-h-[46px] pl-11 pr-11 rounded-xl border border-gray-200 bg-gray-50/60 text-sm outline-none focus:border-[var(--color-primary)] focus:bg-white focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)] transition-colors"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            aria-label="Clear search"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                        >
                            <LuX size={16} />
                        </button>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {[
                        { v: '', l: 'All approvals' },
                        { v: 'pending', l: 'Pending' },
                        { v: 'approved', l: 'Approved' },
                        { v: 'rejected', l: 'Rejected' },
                    ].map((o) => (
                        <button key={o.v || 'all'} type="button" onClick={() => setApprovalStatus(o.v)} className={chipCls(approvalStatus === o.v)}>
                            {o.l}
                        </button>
                    ))}
                    <span className="w-px bg-gray-100 mx-1 flex-shrink-0" />
                    {[
                        { v: '', l: 'Any state' },
                        { v: 'active', l: 'Active' },
                        { v: 'draft', l: 'Draft' },
                        { v: 'out-of-stock', l: 'Out of stock' },
                    ].map((o) => (
                        <button key={o.v || 'any'} type="button" onClick={() => setStatus(o.v)} className={chipCls(status === o.v)}>
                            {o.l}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── List ── */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse flex gap-3">
                            <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0" />
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 w-2/3 bg-gray-200 rounded" />
                                <div className="h-3 w-1/3 bg-gray-100 rounded" />
                                <div className="h-3 w-1/2 bg-gray-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--color-primary-rgb),0.07)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                        <LuPackage size={28} />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-800">
                        {hasFilters ? 'No products match these filters' : 'Your catalogue is empty'}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mt-2 max-w-md mx-auto">
                        {hasFilters
                            ? 'Try a different search or clear the filters to see everything you have listed.'
                            : 'Post your first product with a good photo and a clear price — the owner reviews it, then it goes live across every upazila.'}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                        <button
                            type="button"
                            onClick={openCreate}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            <LuPlus size={16} /> Add product
                        </button>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-6 min-h-[48px] rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Retail</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Wholesale</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Approval</th>
                                    <th className="px-4 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {products.map((p) => (
                                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors align-top">
                                        <td className="px-4 py-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                                    {p.thumbnail ? (
                                                        <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><LuImage size={16} /></div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2">{p.name}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        {typeof p.category === 'object' && p.category ? p.category.name : 'Uncategorised'}
                                                        {p.brand ? ` · ${p.brand}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[13px] font-bold text-gray-800 whitespace-nowrap">{taka(p.price)}</td>
                                        <td className="px-4 py-3 text-[13px] font-semibold text-gray-600 whitespace-nowrap">
                                            {p.wholesalePrice ? taka(p.wholesalePrice) : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`text-[13px] font-bold ${Number(p.stock) > 0 ? 'text-gray-800' : 'text-red-500'}`}>
                                                {p.stock ?? 0}
                                            </span>
                                            <span className="text-[11px] text-gray-400"> {p.unit || 'piece'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ApprovalPill status={p.approvalStatus} />
                                            {p.approvalStatus === 'rejected' && p.approvalNote && (
                                                <p className="text-[11px] text-red-500 mt-1.5 max-w-[220px] leading-snug">{p.approvalNote}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(p)}
                                                    aria-label={`Edit ${p.name}`}
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-[var(--color-primary)] hover:bg-[rgba(var(--color-primary-rgb),0.08)] transition-colors"
                                                >
                                                    <LuPencil size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDelete(p)}
                                                    aria-label={`Delete ${p.name}`}
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <LuTrash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-gray-50">
                        {products.map((p) => (
                            <div key={p._id} className="p-3.5">
                                <div className="flex gap-3">
                                    <div className="w-[74px] h-[74px] rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                        {p.thumbnail ? (
                                            <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><LuImage size={18} /></div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2">{p.name}</p>
                                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-1">
                                            <span className="text-[14px] font-extrabold text-[var(--color-primary)]">{taka(p.price)}</span>
                                            {Boolean(p.wholesalePrice) && (
                                                <span className="text-[11px] font-semibold text-gray-500">wholesale {taka(p.wholesalePrice)}</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            Stock <span className={Number(p.stock) > 0 ? 'text-gray-600 font-bold' : 'text-red-500 font-bold'}>{p.stock ?? 0}</span> {p.unit || 'piece'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-3">
                                    <ApprovalPill status={p.approvalStatus} />
                                    <div className="ml-auto flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(p)}
                                            className="inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-lg text-[12px] font-bold text-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.08)]"
                                        >
                                            <LuPencil size={13} /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDelete(p)}
                                            aria-label={`Delete ${p.name}`}
                                            className="w-[38px] h-[38px] flex items-center justify-center rounded-lg text-red-500 bg-red-50"
                                        >
                                            <LuTrash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {p.approvalStatus === 'rejected' && p.approvalNote && (
                                    <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2.5 leading-snug">
                                        {p.approvalNote}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {meta.totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between gap-3">
                            <p className="text-[12px] font-semibold text-gray-400">
                                Page {page} of {meta.totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    aria-label="Previous page"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors"
                                >
                                    <LuChevronLeft size={17} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                    disabled={page >= meta.totalPages}
                                    aria-label="Next page"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 hover:border-[rgba(var(--color-primary-rgb),0.35)] transition-colors"
                                >
                                    <LuChevronRight size={17} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Create / edit modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative w-full sm:max-w-2xl max-h-[92vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
                        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 flex-shrink-0">
                            <h2 className="text-base font-extrabold text-gray-900">
                                {editing ? 'Edit product' : 'Add a product'}
                            </h2>
                            <button
                                type="button"
                                onClick={closeModal}
                                aria-label="Close"
                                className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50"
                            >
                                <LuX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto px-4 sm:px-5 py-4 space-y-4">

                            {/* The one rule a supplier must know before they touch anything. */}
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
                                <LuTriangleAlert size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-[13px] text-amber-800 leading-relaxed">
                                    <span className="font-bold">Editing an approved product sends it back for review.</span>{' '}
                                    Stock-only changes do not.
                                </p>
                            </div>

                            <div>
                                <label className={labelCls} htmlFor="p-name">Product name <span className="text-red-500">*</span></label>
                                <input
                                    id="p-name"
                                    className={inputCls}
                                    value={form.name}
                                    onChange={(e) => set('name', e.target.value)}
                                    placeholder="e.g. Premium Cement 50kg Bag"
                                />
                                {errors.name && <p className={errCls}>{errors.name}</p>}
                            </div>

                            <div>
                                <label className={labelCls} htmlFor="p-desc">Description <span className="text-red-500">*</span></label>
                                <textarea
                                    id="p-desc"
                                    rows={4}
                                    className={`${inputCls} resize-y`}
                                    value={form.description}
                                    onChange={(e) => set('description', e.target.value)}
                                    placeholder="What it is, what it is used for, what makes it worth buying."
                                />
                                {errors.description && <p className={errCls}>{errors.description}</p>}
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className={labelCls} htmlFor="p-price">Retail price (৳) <span className="text-red-500">*</span></label>
                                    <input id="p-price" type="number" min="0" inputMode="decimal" className={inputCls} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" />
                                    {errors.price && <p className={errCls}>{errors.price}</p>}
                                </div>
                                <div>
                                    <label className={labelCls} htmlFor="p-original">Old price (৳)</label>
                                    <input id="p-original" type="number" min="0" inputMode="decimal" className={inputCls} value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} placeholder="Optional" />
                                    {errors.originalPrice && <p className={errCls}>{errors.originalPrice}</p>}
                                </div>
                                <div>
                                    <label className={labelCls} htmlFor="p-wholesale">Wholesale price (৳)</label>
                                    <input id="p-wholesale" type="number" min="0" inputMode="decimal" className={inputCls} value={form.wholesalePrice} onChange={(e) => set('wholesalePrice', e.target.value)} placeholder="0 = not sold wholesale" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className={labelCls} htmlFor="p-moq">Minimum order (MOQ)</label>
                                    <input id="p-moq" type="number" min="1" inputMode="numeric" className={inputCls} value={form.moq} onChange={(e) => set('moq', e.target.value)} placeholder="1" />
                                    {errors.moq && <p className={errCls}>{errors.moq}</p>}
                                </div>
                                <div>
                                    <label className={labelCls} htmlFor="p-stock">Stock</label>
                                    <input id="p-stock" type="number" min="0" inputMode="numeric" className={inputCls} value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" />
                                </div>
                                <div>
                                    <label className={labelCls} htmlFor="p-unit">Unit</label>
                                    <select id="p-unit" className={inputCls} value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls} htmlFor="p-category">Category <span className="text-red-500">*</span></label>
                                    <select id="p-category" className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
                                        <option value="">Choose a category</option>
                                        {rootCategories.map((c) => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                        {childCategories.length > 0 && (
                                            <optgroup label="Sub-categories">
                                                {childCategories.map((c) => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                    {errors.category && <p className={errCls}>{errors.category}</p>}
                                </div>
                                <div>
                                    <label className={labelCls} htmlFor="p-brand">Brand</label>
                                    <input id="p-brand" className={inputCls} value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Optional" />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls} htmlFor="p-tags">Tags</label>
                                <input
                                    id="p-tags"
                                    className={inputCls}
                                    value={form.tags}
                                    onChange={(e) => set('tags', e.target.value)}
                                    placeholder="Separate with commas — cement, construction, 50kg"
                                />
                                <p className="text-[11px] text-gray-400 mt-1.5">Tags help buyers find this product in search.</p>
                            </div>

                            {/* Main photo */}
                            <div>
                                <label className={labelCls}>Main photo <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-3">
                                    <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
                                        {form.thumbnail ? (
                                            <img src={form.thumbnail} alt="Main" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><LuImage size={20} /></div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => thumbRef.current?.click()}
                                            disabled={uploading}
                                            className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-gray-100 text-gray-700 text-[13px] font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                        >
                                            {uploading ? <LuLoader size={15} className="animate-spin" /> : <LuUpload size={15} />}
                                            {form.thumbnail ? 'Replace' : 'Upload'}
                                        </button>
                                        {form.thumbnail && (
                                            <button
                                                type="button"
                                                onClick={() => set('thumbnail', '')}
                                                className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl text-[13px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                                            >
                                                <LuX size={15} /> Remove
                                            </button>
                                        )}
                                    </div>
                                    <input ref={thumbRef} type="file" accept="image/*" hidden onChange={(e) => handleThumb(e.target.files)} />
                                </div>
                                {errors.thumbnail && <p className={errCls}>{errors.thumbnail}</p>}
                            </div>

                            {/* Gallery */}
                            <div>
                                <label className={labelCls}>More photos <span className="text-gray-400 font-normal">(up to 5)</span></label>
                                <div className="flex flex-wrap gap-2">
                                    {form.images.map((url, i) => (
                                        <div key={`${url}-${i}`} className="relative w-[68px] h-[68px] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                                                aria-label={`Remove photo ${i + 1}`}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                                            >
                                                <LuX size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {form.images.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => galleryRef.current?.click()}
                                            disabled={uploading}
                                            className="w-[68px] h-[68px] rounded-xl border-2 border-dashed border-gray-200 text-gray-400 flex items-center justify-center hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50 transition-colors"
                                        >
                                            {uploading ? <LuLoader size={17} className="animate-spin" /> : <LuPlus size={19} />}
                                        </button>
                                    )}
                                    <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleGallery(e.target.files)} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 pb-1">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="flex-1 min-h-[48px] rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || uploading}
                                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] disabled:opacity-60 transition-colors"
                                >
                                    {saving && <LuLoader size={16} className="animate-spin" />}
                                    {editing ? 'Save changes' : 'Submit for review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete confirm ── */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setConfirmDelete(null)} />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                            <LuTrash2 size={22} />
                        </div>
                        <h3 className="text-base font-extrabold text-gray-900">Remove this product?</h3>
                        <p className="text-[13px] text-gray-500 leading-relaxed mt-2">
                            <span className="font-semibold text-gray-700">{confirmDelete.name}</span> will be taken off your
                            catalogue and the storefront. Orders already placed for it are not affected.
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row gap-2.5 mt-5">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                disabled={deleting}
                                className="flex-1 min-h-[46px] rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors"
                            >
                                Keep it
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[46px] rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 transition-colors"
                            >
                                {deleting && <LuLoader size={15} className="animate-spin" />} Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
