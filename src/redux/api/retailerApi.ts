import { baseApi } from './baseApi';

export const retailerApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        applyRetailer: builder.mutation({
            query: (data) => ({ url: '/retailers/apply', method: 'POST', body: data }),
            invalidatesTags: ['Retailers', 'Partners'],
        }),
        getMyRetailer: builder.query({
            query: () => '/retailers/me',
            providesTags: ['Retailers', 'Partners'],
        }),
        updateMyRetailer: builder.mutation({
            query: (data) => ({ url: '/retailers/me', method: 'PATCH', body: data }),
            invalidatesTags: ['Retailers', 'Partners'],
        }),
        // My wholesale orders — GET /api/orders/retailer/my → { orders, meta }
        getMyRetailerOrders: builder.query({
            query: (params: { status?: string; page?: number; limit?: number } | void) => ({
                url: '/orders/retailer/my',
                params: params || undefined,
            }),
            providesTags: ['Orders'],
        }),
        /**
         * The trade catalogue — GET /api/products/wholesale → { products, meta }.
         * Answers 404 without a retailer profile and 403 until the shop is
         * verified, so callers must render a locked state rather than assume data.
         */
        getWholesaleCatalogue: builder.query({
            query: (params: { q?: string; company?: string; category?: string; page?: number; limit?: number } | void) => ({
                url: '/products/wholesale',
                params: params || undefined,
            }),
            providesTags: ['Products'],
        }),
        // Dealer view: the shops in one upazila — GET /api/retailers/by-upazila/:id
        getRetailersByUpazila: builder.query({
            query: (upazilaId: string) => `/retailers/by-upazila/${upazilaId}`,
            providesTags: ['Retailers'],
        }),
        // Admin
        getRetailers: builder.query({
            query: (params: { status?: string; page?: number; limit?: number } | void) => ({
                url: '/retailers',
                params: params || undefined,
            }),
            providesTags: ['Retailers'],
        }),
        getRetailerById: builder.query({
            query: (id: string) => `/retailers/${id}`,
            providesTags: ['Retailers'],
        }),
        approveRetailer: builder.mutation({
            query: (id: string) => ({ url: `/retailers/${id}/approve`, method: 'PATCH' }),
            invalidatesTags: ['Retailers'],
        }),
        rejectRetailer: builder.mutation({
            query: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => ({
                url: `/retailers/${id}/reject`, method: 'PATCH', body: { rejectionReason },
            }),
            invalidatesTags: ['Retailers'],
        }),
        suspendRetailer: builder.mutation({
            query: (id: string) => ({ url: `/retailers/${id}/suspend`, method: 'PATCH' }),
            invalidatesTags: ['Retailers'],
        }),
        updateRetailer: builder.mutation({
            query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
                url: `/retailers/${id}`, method: 'PATCH', body: data,
            }),
            invalidatesTags: ['Retailers'],
        }),
    }),
});

export const {
    useApplyRetailerMutation,
    useGetMyRetailerQuery,
    useUpdateMyRetailerMutation,
    useGetMyRetailerOrdersQuery,
    useGetWholesaleCatalogueQuery,
    useGetRetailersByUpazilaQuery,
    useGetRetailersQuery,
    useGetRetailerByIdQuery,
    useApproveRetailerMutation,
    useRejectRetailerMutation,
    useSuspendRetailerMutation,
    useUpdateRetailerMutation,
} = retailerApi;
