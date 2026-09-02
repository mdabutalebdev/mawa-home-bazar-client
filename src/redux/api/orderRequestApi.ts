import { baseApi } from './baseApi';

export const orderRequestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public: submit a service request from the storefront.
        createOrderRequest: builder.mutation({
            query: (data) => ({ url: '/order-requests', method: 'POST', body: data }),
            invalidatesTags: ['OrderRequests'],
        }),
        // Dealer: requests routed to my area.
        getDealerOrderRequests: builder.query({
            query: (params) => ({ url: '/order-requests/dealer', params }),
            providesTags: ['OrderRequests'],
        }),
        getDealerOrderRequestCounts: builder.query({
            query: () => '/order-requests/dealer/counts',
            providesTags: ['OrderRequests'],
        }),
        // Dealer: single request.
        getDealerSingleOrderRequest: builder.query({
            query: (id) => ({ url: `/order-requests/dealer/${id}` }),
            providesTags: ['OrderRequests'],
        }),
        // Admin: every request.
        getAdminOrderRequests: builder.query({
            query: (params) => ({ url: '/order-requests/admin', params }),
            providesTags: ['OrderRequests'],
        }),
        // Admin: single request.
        getAdminSingleOrderRequest: builder.query({
            query: (id) => ({ url: `/order-requests/admin/${id}` }),
            providesTags: ['OrderRequests'],
        }),
        // Dealer (own) or admin: update status / note.
        updateOrderRequestStatus: builder.mutation({
            query: ({ id, data }) => ({ url: `/order-requests/${id}/status`, method: 'PATCH', body: data }),
            invalidatesTags: ['OrderRequests'],
        }),
    }),
});

export const {
    useCreateOrderRequestMutation,
    useGetDealerOrderRequestsQuery,
    useGetDealerOrderRequestCountsQuery,
    useGetDealerSingleOrderRequestQuery,
    useGetAdminOrderRequestsQuery,
    useGetAdminSingleOrderRequestQuery,
    useUpdateOrderRequestStatusMutation,
} = orderRequestApi;
