import { baseApi } from './baseApi';

export const dealerApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public: approved dealers, filterable by area — GET /api/dealers/public
        getPublicDealers: builder.query({
            query: (params: { upazila?: string; district?: string } | void) => ({
                url: '/dealers/public',
                params: params || undefined,
            }),
            providesTags: ['Dealers'],
        }),
        // Public: the one dealer covering an upazila — GET /api/dealers/public/by-upazila/:id
        getDealerByUpazila: builder.query({
            query: (upazilaId: string) => `/dealers/public/by-upazila/${upazilaId}`,
            providesTags: ['Dealers'],
        }),
        // Apply to become a dealer — POST /api/dealers/apply
        applyDealer: builder.mutation({
            query: (data) => ({ url: '/dealers/apply', method: 'POST', body: data }),
            invalidatesTags: ['Dealers', 'Partners'],
        }),
        // My dealer profile — GET /api/dealers/me
        getMyDealer: builder.query({
            query: () => '/dealers/me',
            providesTags: ['Dealers', 'Partners'],
        }),
        updateMyDealer: builder.mutation({
            query: (data) => ({ url: '/dealers/me', method: 'PATCH', body: data }),
            invalidatesTags: ['Dealers', 'Partners'],
        }),
        // ── Dealer order queue ───────────────────────
        // Served by the order module but dealer-scoped: the server resolves the
        // territory from the caller's own profile, so nothing here sends an id.
        // Response: { data: { orders, meta } }
        getDealerOrders: builder.query({
            query: (params: {
                page?: number;
                limit?: number;
                status?: string;
                orderType?: string;
                /** 'false' = not yet confirmed (needs my call), 'true' = confirmed. */
                confirmed?: string;
            } | void) => ({
                url: '/orders/dealer/my',
                params: params || undefined,
            }),
            providesTags: ['Orders'],
        }),
        getDealerOrderStats: builder.query({
            query: () => '/orders/dealer/stats',
            providesTags: ['Orders', 'Stats'],
        }),
        // One leg of the confirmation call. The server stamps `confirmedAt` only
        // once both legs are in — that stamp is what unblocks the company.
        confirmDealerOrder: builder.mutation({
            query: ({ id, ...body }: {
                id: string;
                customerCalled?: boolean;
                companyCalled?: boolean;
                note?: string;
            }) => ({
                url: `/orders/dealer/${id}/confirm`, method: 'PATCH', body,
            }),
            invalidatesTags: ['Orders', 'Stats'],
        }),
        // Admin
        getDealers: builder.query({
            query: (params: { status?: string; page?: number; limit?: number } | void) => ({
                url: '/dealers',
                params: params || undefined,
            }),
            providesTags: ['Dealers'],
        }),
        getDealerById: builder.query({
            query: (id: string) => `/dealers/${id}`,
            providesTags: ['Dealers'],
        }),
        /**
         * The endpoint takes an optional `commissionRate` because the owner
         * usually settles the terms at the moment of approval — pass either a
         * bare id or `{ id, commissionRate }`.
         * Answers 409 when the upazila already has an approved dealer.
         */
        approveDealer: builder.mutation({
            query: (arg: string | { id: string; commissionRate?: number }) => {
                const id = typeof arg === 'string' ? arg : arg.id;
                const rate = typeof arg === 'string' ? undefined : arg.commissionRate;
                return {
                    url: `/dealers/${id}/approve`,
                    method: 'PATCH',
                    body: rate === undefined ? {} : { commissionRate: rate },
                };
            },
            invalidatesTags: ['Dealers', 'Geo'],
        }),
        rejectDealer: builder.mutation({
            query: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => ({
                url: `/dealers/${id}/reject`, method: 'PATCH', body: { rejectionReason },
            }),
            invalidatesTags: ['Dealers', 'Geo'],
        }),
        suspendDealer: builder.mutation({
            query: (id: string) => ({ url: `/dealers/${id}/suspend`, method: 'PATCH' }),
            invalidatesTags: ['Dealers', 'Geo'],
        }),
        updateDealer: builder.mutation({
            query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
                url: `/dealers/${id}`, method: 'PATCH', body: data,
            }),
            invalidatesTags: ['Dealers'],
        }),
    }),
});

export const {
    useGetPublicDealersQuery,
    useGetDealerByUpazilaQuery,
    useApplyDealerMutation,
    useGetMyDealerQuery,
    useUpdateMyDealerMutation,
    useGetDealerOrdersQuery,
    useGetDealerOrderStatsQuery,
    useConfirmDealerOrderMutation,
    useGetDealersQuery,
    useGetDealerByIdQuery,
    useApproveDealerMutation,
    useRejectDealerMutation,
    useSuspendDealerMutation,
    useUpdateDealerMutation,
} = dealerApi;
