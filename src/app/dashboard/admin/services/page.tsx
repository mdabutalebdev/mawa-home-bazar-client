"use client";

import React, { useState } from 'react';
import {
    LuPlus, LuSquarePen, LuTrash2, LuSearch, LuX, LuSave, LuLayoutGrid, LuWrench,
} from 'react-icons/lu';
import {
    useGetAdminCompanyServicesQuery,
    useCreateCompanyServiceMutation,
    useUpdateCompanyServiceMutation,
    useDeleteCompanyServiceMutation,
} from '@/redux/api/companyServiceApi';
import { toast } from 'react-hot-toast';

/* ─── Styles ─── */
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '5px' };
const errStyle: React.CSSProperties = { fontSize: '11px', color: '#ef4444', margin: '4px 0 0' };

const AdminServicesPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: servicesData, isLoading } = useGetAdminCompanyServicesQuery({});
    const [deleteService] = useDeleteCompanyServiceMutation();
    const [createService, { isLoading: isCreating }] = useCreateCompanyServiceMutation();
    const [updateService, { isLoading: isUpdating }] = useUpdateCompanyServiceMutation();

    /* ─── Modal State ─── */
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ title: '', description: '', image: '', isActive: true });
    /* per-field inline errors */
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const services = servicesData?.data || [];
    const isSaving = isCreating || isUpdating;

    const openCreate = () => {
        setEditingId(null);
        setForm({ title: '', description: '', image: '', isActive: true });
        setFieldErrors({});
        setModalOpen(true);
    };

    const openEdit = (srv: any) => {
        setEditingId(srv._id);
        setForm({
            title: srv.title || '',
            description: srv.description || '',
            image: srv.image || '',
            isActive: srv.isActive !== false,
        });
        setFieldErrors({});
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingId(null); setFieldErrors({}); };

    const validate = (): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (!form.title.trim()) errs.title = 'Service title is required';
        return errs;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            toast.error('Please fix the highlighted fields');
            return;
        }
        setFieldErrors({});

        const payload: any = {
            title: form.title.trim(),
            description: form.description,
            image: form.image,
            isActive: form.isActive,
        };

        try {
            if (editingId) {
                await updateService({ id: editingId, data: payload }).unwrap();
                toast.success('Service updated');
            } else {
                await createService(payload).unwrap();
                toast.success('Service created');
            }
            closeModal();
        } catch (error: any) {
            const errorMessages = error?.data?.errorMessages;
            if (Array.isArray(errorMessages) && errorMessages.length > 0) {
                const mapped: Record<string, string> = {};
                errorMessages.forEach((em: any) => { if (em?.path) mapped[em.path] = em.message; });
                setFieldErrors(mapped);
                toast.error(errorMessages[0]?.message || 'Please fix the highlighted fields');
            } else {
                toast.error(error?.data?.message || 'Something went wrong');
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            try {
                await deleteService(id).unwrap();
                toast.success('Service deleted');
            } catch (error: any) {
                toast.error(error?.data?.message || 'Failed to delete');
            }
        }
    };

    const filtered = services.filter((srv: any) =>
        srv.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0 }}>Company Services</h1>
                    <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>Manage global services for companies</p>
                </div>
                <button onClick={openCreate} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                    cursor: 'pointer',
                }}>
                    <LuPlus size={14} /> Add Service
                </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
                <LuSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inp, paddingLeft: '34px' }}
                />
            </div>

            {/* Services List */}
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                    </div>
                ) : filtered.length > 0 ? (
                    <div>
                        {filtered.map((srv: any, i: number) => (
                            <div key={srv._id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: '#fff',
                                borderBottom: i < filtered.length - 1 ? '1px solid #f5f5f5' : 'none',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '8px',
                                        background: '#f5f5f5', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
                                    }}>
                                        {srv.image ? (
                                            <img src={srv.image} alt={srv.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <LuWrench size={18} color="#bbb" />
                                        )}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            {srv.title}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '10.5px', color: '#aaa', fontFamily: 'monospace' }}>{srv.slug}</span>
                                            <span style={{
                                                fontSize: '9px', fontWeight: 700,
                                                padding: '1px 6px', borderRadius: '999px',
                                                background: srv.isActive ? 'var(--color-primary-lightest)' : '#fef2f2',
                                                color: srv.isActive ? '#16a34a' : '#dc2626',
                                            }}>
                                                {srv.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => openEdit(srv)} style={{
                                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
                                        cursor: 'pointer', color: 'var(--color-primary)', transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-lightest)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                                    >
                                        <LuSquarePen size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(srv._id)} style={{
                                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
                                        cursor: 'pointer', color: '#dc2626', transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                                    >
                                        <LuTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        padding: '56px 24px', textAlign: 'center',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--color-primary-lightest) 0%, var(--color-primary-light) 100%)',
                            boxShadow: 'inset 0 0 0 1px var(--color-primary-border)',
                            marginBottom: '18px',
                        }}>
                            <LuWrench size={30} color="var(--color-primary)" />
                        </div>

                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111', margin: '0 0 6px' }}>
                            No services yet
                        </h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 22px', maxWidth: '320px', lineHeight: 1.5 }}>
                            Services are global categories (like Plumber, Electrician) that companies can list under.
                        </p>

                        <button onClick={openCreate} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '11px 24px', background: 'var(--color-primary)', color: '#fff',
                            border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700,
                            cursor: 'pointer', letterSpacing: '0.2px',
                            boxShadow: '0 6px 16px rgba(var(--color-primary-rgb),0.28)',
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
                        }}>
                            <LuPlus size={16} strokeWidth={2.6} /> Add Service
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ POPUP MODAL ═══ */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div onClick={closeModal} style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    }} />

                    <div style={{
                        position: 'relative', background: '#fff',
                        borderRadius: '12px', width: '500px', maxWidth: '95vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.2s ease-out',
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111', margin: 0 }}>
                                {editingId ? 'Edit Service' : 'Add Service'}
                            </h3>
                            <button onClick={closeModal} style={{
                                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#f5f5f5', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#888',
                            }}>
                                <LuX size={14} />
                            </button>
                        </div>

                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div>
                                <label style={lbl}>Service Title <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Electrician, Plumbing"
                                    value={form.title}
                                    onChange={e => { setForm(p => ({ ...p, title: e.target.value })); if (fieldErrors.title) setFieldErrors(p => ({ ...p, title: '' })); }}
                                    style={{ ...inp, borderColor: fieldErrors.title ? '#fca5a5' : '#e5e7eb' }}
                                    autoFocus
                                />
                                {fieldErrors.title && <p style={errStyle}>{fieldErrors.title}</p>}
                            </div>
                            
                            <div>
                                <label style={lbl}>Image URL <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={form.image}
                                    onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                                    style={inp}
                                />
                                {form.image && (
                                    <div style={{ marginTop: '8px', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                                        <img src={form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={lbl}>Description <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                                <textarea
                                    placeholder="Short description..."
                                    rows={3}
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    style={{ ...inp, resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                    <span style={{ fontSize: '12.5px', color: '#555', fontWeight: 500 }}>Active Status</span>
                                    <div
                                        onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                                        style={{
                                            position: 'relative', width: '36px', height: '20px',
                                            borderRadius: '999px', cursor: 'pointer',
                                            background: form.isActive ? 'var(--color-primary)' : '#ddd',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute', top: '3px',
                                            left: form.isActive ? '19px' : '3px',
                                            width: '14px', height: '14px', borderRadius: '50%',
                                            background: '#fff', transition: 'left 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                        }} />
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex', gap: '8px', padding: '14px 20px',
                            borderTop: '1px solid #f0f0f0',
                        }}>
                            <button onClick={closeModal} style={{
                                flex: 1, padding: '9px', background: '#f5f5f5', color: '#666',
                                border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600,
                                cursor: 'pointer',
                            }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} style={{
                                flex: 1, padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: isSaving ? '#888' : 'var(--color-primary)', color: '#fff',
                                border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                            }}>
                                <LuSave size={13} />
                                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminServicesPage;
