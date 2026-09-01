"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useGetAdminOrderRequestsQuery, useUpdateOrderRequestStatusMutation } from '@/redux/api/orderRequestApi';
import OrderRequestList from '@/components/dashboard/OrderRequestList';

export default function AdminOrderRequestsPage() {
    const [status, setStatus] = useState('');
    const { data, isLoading } = useGetAdminOrderRequestsQuery(status ? { status } : {});
    const [updateStatus] = useUpdateOrderRequestStatusMutation();

    const onUpdate = async (id: string, s: string) => {
        try {
            await updateStatus({ id, data: { status: s } }).unwrap();
            toast.success('Status updated');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not update');
        }
    };

    return (
        <OrderRequestList
            title="Order Requests"
            requests={data?.data || []}
            total={data?.meta?.total}
            isLoading={isLoading}
            onUpdateStatus={onUpdate}
            statusFilter={status}
            setStatusFilter={setStatus}
            showDealer
        />
    );
}
