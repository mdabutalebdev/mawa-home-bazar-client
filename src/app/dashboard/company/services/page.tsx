"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { LuWrench, LuPlus, LuTrash2, LuLoaderCircle, LuPencil, LuCheck, LuX } from 'react-icons/lu';
import {
    useGetMyCompanyServicesQuery,
    useCreateCompanyServiceMutation,
    useUpdateCompanyServiceMutation,
    useDeleteCompanyServiceMutation,
} from '@/redux/api/companyServiceApi';
import { SingleImageUploader } from '@/components/ui/ImageUploader';

const inputCls =
    'w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 bg-white outline-none ' +
    'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)] transition-colors';

export default function CompanyServicesPage() {
    const { data, isLoading } = useGetMyCompanyServicesQuery(undefined);
    const services: any[] = data?.data || [];

    const [createSrv, { isLoading: creating }] = useCreateCompanyServiceMutation();
    const [updateSrv] = useUpdateCompanyServiceMutation();
    const [deleteSrv] = useDeleteCompanyServiceMutation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [editing, setEditing] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { toast.error('Service title is required'); return; }
        try {
            await createSrv({ title: title.trim(), description: description.trim(), image }).unwrap();
            toast.success('Service created');
            setTitle(''); setDescription(''); setImage('');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not create service');
        }
    };

    const remove = async (id: string, srvTitle: string) => {
        if (!window.confirm(`Delete "${srvTitle}"?`)) return;
        try {
            await deleteSrv(id).unwrap();
            toast.success('Service deleted');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not delete this service');
        }
    };

    const saveEdit = async (id: string) => {
        if (!editTitle.trim()) { toast.error('Title cannot be empty'); return; }
        try {
            await updateSrv({ id, data: { title: editTitle.trim() } }).unwrap();
            toast.success('Service updated');
            setEditing(null);
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not update');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <LuWrench className="text-[var(--color-primary)]" size={20} /> My Custom Services
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Create your own custom services, then choose them when you upload a product.
                </p>
            </div>

            {/* Add form */}
            <form onSubmit={add} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Add a custom service</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title <span className="text-red-500">*</span></label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. AC Repair" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Short description</label>
                        <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Optional" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Image (optional)</label>
                    <SingleImageUploader label="Service image" value={image} onChange={(url: string) => setImage(url)} />
                </div>
                <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] disabled:opacity-60 transition-colors"
                >
                    {creating ? <LuLoaderCircle className="animate-spin" size={16} /> : <LuPlus size={16} />} Add Service
                </button>
            </form>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Your custom services ({services.length})</p>
                {isLoading ? (
                    <p className="text-sm text-gray-400 py-6 text-center">Loading…</p>
                ) : services.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">No custom services yet. Add your first one above.</p>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {services.map((srv) => (
                            <div key={srv._id} className="flex items-center gap-3 py-2.5">
                                {srv.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={srv.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-[rgba(var(--color-primary-rgb),0.08)] flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                                        <LuWrench size={16} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    {editing === srv._id ? (
                                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} autoFocus />
                                    ) : (
                                        <>
                                            <p className="text-sm font-bold text-gray-900 truncate">{srv.title}</p>
                                        </>
                                    )}
                                </div>
                                {editing === srv._id ? (
                                    <>
                                        <button onClick={() => saveEdit(srv._id)} aria-label="Save" className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100"><LuCheck size={15} /></button>
                                        <button onClick={() => setEditing(null)} aria-label="Cancel" className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100"><LuX size={15} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setEditing(srv._id); setEditTitle(srv.title); }} aria-label="Edit" className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:text-[var(--color-primary)] flex items-center justify-center"><LuPencil size={14} /></button>
                                        <button onClick={() => remove(srv._id, srv.title)} aria-label="Delete" className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"><LuTrash2 size={14} /></button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
