import { baseApi } from './baseApi';

export const deliveryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        applyDeliveryMan: builder.mutation({
            query: (data) => ({ url: '/delivery/apply', method: 'POST', body: data }),
            invalidatesTags: ['Delivery', 'Partners'],
        }),
        getMyDeliveryMan: builder.query({
            query: () => '/delivery/me',
            providesTags: ['Delivery', 'Partners'],
        }),
        setAvailability: builder.mutation({
            query: (isAvailable: boolean) => ({
                url: '/delivery/me/availability', method: 'PATCH', body: { isAvailable },
            }),
            invalidatesTags: ['Delivery'],
        }),
        getRidersByDealer: builder.query({
            query: (dealerId: string) => `/delivery/by-dealer/${dealerId}`,
            providesTags: ['Delivery'],
        }),

        // ── Assignments ──────────────────────────────────────────
        createAssignment: builder.mutation({
            query: (data: { order: string; deliveryMan: string }) => ({
                url: '/delivery/assignments', method: 'POST', body: data,
            }),
            invalidatesTags: ['Delivery', 'Orders'],
        }),
        getMyAssignments: builder.query({
            query: (params: { status?: string } | void) => ({
                url: '/delivery/assignments/my',
                params: params || undefined,
            }),
            providesTags: ['Delivery'],
        }),
        // 'delivered' requires the customer's OTP in the body.
        updateAssignmentStatus: builder.mutation({
            query: ({ id, status, otp, ...rest }: { id: string; status: string; otp?: string;[k: string]: unknown }) => ({
                url: `/delivery/assignments/${id}/status`, method: 'PATCH', body: { status, otp, ...rest },
            }),
            invalidatesTags: ['Delivery', 'Orders'],
        }),
        pushLocation: builder.mutation({
            query: ({ id, lat, lng }: { id: string; lat: number; lng: number }) => ({
                url: `/delivery/assignments/${id}/location`, method: 'POST', body: { lat, lng },
            }),
            // Breadcrumbs fire every few seconds — re-fetching the list each
            // time would be pure noise, so this deliberately invalidates nothing.
        }),
        getAssignmentByOrder: builder.query({
            query: (orderId: string) => `/delivery/assignments/order/${orderId}`,
            providesTags: ['Delivery'],
        }),

        // Admin
        getDeliveryMen: builder.query({
            query: (params: { status?: string; page?: number; limit?: number } | void) => ({
                url: '/delivery',
                params: params || undefined,
            }),
            providesTags: ['Delivery'],
        }),
        approveDeliveryMan: builder.mutation({
            query: (id: string) => ({ url: `/delivery/${id}/approve`, method: 'PATCH' }),
            invalidatesTags: ['Delivery'],
        }),
        rejectDeliveryMan: builder.mutation({
            query: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => ({
                url: `/delivery/${id}/reject`, method: 'PATCH', body: { rejectionReason },
            }),
            invalidatesTags: ['Delivery'],
        }),
        suspendDeliveryMan: builder.mutation({
            query: (id: string) => ({ url: `/delivery/${id}/suspend`, method: 'PATCH' }),
            invalidatesTags: ['Delivery'],
        }),
    }),
});

export const {
    useApplyDeliveryManMutation,
    useGetMyDeliveryManQuery,
    useSetAvailabilityMutation,
    useGetRidersByDealerQuery,
    useCreateAssignmentMutation,
    useGetMyAssignmentsQuery,
    useUpdateAssignmentStatusMutation,
    usePushLocationMutation,
    useGetAssignmentByOrderQuery,
    useGetDeliveryMenQuery,
    useApproveDeliveryManMutation,
    useRejectDeliveryManMutation,
    useSuspendDeliveryManMutation,
} = deliveryApi;
