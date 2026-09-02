"use client";

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useGetDealerSingleOrderRequestQuery, useUpdateOrderRequestStatusMutation } from '@/redux/api/orderRequestApi';
import { LuArrowLeft, LuInbox, LuPhone, LuMapPin, LuClock, LuUser, LuMessageSquare, LuStore } from 'react-icons/lu';
import { toast } from 'react-hot-toast';

const STATUSES = [
    { key: 'new', label: 'New', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'contacted', label: 'Contacted', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'completed', label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'cancelled', label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
];

const badgeCls = (s?: string) => STATUSES.find((x) => x.key === s)?.cls || 'bg-gray-50 text-gray-600 border-gray-200';

const fmtDate = (d?: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) + ' at ' + dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

export default function DealerOrderRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data, isLoading, error } = useGetDealerSingleOrderRequestQuery(id);
    const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderRequestStatusMutation();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !data?.data) {
        return (
            <div className="text-center py-10">
                <p className="text-sm text-gray-500">Could not load order request details.</p>
                <button onClick={() => router.back()} className="mt-2 text-sm text-[var(--color-primary)] font-medium">Go Back</button>
            </div>
        );
    }

    const req = data.data;
    const area = [req.upazila?.name, req.district?.name, req.division?.name].filter(Boolean).join(', ');

    const handleUpdateStatus = async (s: string) => {
        try {
            await updateStatus({ id, data: { status: s } }).unwrap();
            toast.success('Status updated');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not update status');
        }
    };

    return (
        <div className="space-y-4 text-gray-800">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                        title="Back"
                    >
                        <LuArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">{req.requestId}</h1>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <LuClock size={12} /> {fmtDate(req.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Status:</span>
                    <select
                        value={req.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        disabled={isUpdating}
                        className={`text-xs font-medium px-2 py-1 rounded border outline-none cursor-pointer ${badgeCls(req.status)}`}
                    >
                        {STATUSES.map((sx) => <option key={sx.key} value={sx.key}>{sx.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                    
                    {req.serviceTitle && (
                        <div className="bg-white border border-gray-200 p-4 rounded-lg">
                            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><LuInbox size={14} /> Requested Service</h2>
                            <p className="text-sm font-medium text-gray-800">{req.serviceTitle}</p>
                        </div>
                    )}

                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5"><LuUser size={14} /> Customer & Location</h2>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Name</p>
                                <p className="text-sm">{req.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                                <p className="text-sm"><a href={`tel:${req.phone}`} className="text-[var(--color-primary)] hover:underline">{req.phone || 'N/A'}</a></p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Area (Upazila, District)</p>
                                <p className="text-sm">{area || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Detailed Address</p>
                                <p className="text-sm">{req.address || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><LuMessageSquare size={14} /> Message</h2>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded text-sm min-h-[60px]">
                            {req.message ? (
                                <p className="whitespace-pre-line">{req.message}</p>
                            ) : (
                                <span className="italic text-gray-400">No message provided.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
