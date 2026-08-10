import { baseApi } from './baseApi';

export const walletApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // My wallet — GET /api/wallet/me
        // Returns balance plus `pendingWithdrawal` and `available`; spend against
        // `available`, never `balance`, or a customer can request the same money twice.
        getMyWallet: builder.query({
            query: () => '/wallet/me',
            providesTags: ['Wallet'],
        }),
        getMyWalletTransactions: builder.query({
            query: (params: { type?: string; status?: string; page?: number; limit?: number } | void) => ({
                url: '/wallet/me/transactions',
                params: params || undefined,
            }),
            providesTags: ['Wallet'],
        }),
        // A deposit claim: the customer has already sent the money and is giving
        // us the transaction id. Nothing is credited until the owner verifies it.
        requestDeposit: builder.mutation({
            query: (body: {
                amount: number; method: string; transactionId: string;
                senderNumber?: string; receiverNumber?: string; note?: string;
            }) => ({ url: '/wallet/deposit', method: 'POST', body }),
            invalidatesTags: ['Wallet'],
        }),
        requestWithdraw: builder.mutation({
            query: (body: { amount: number; method: string; receiverNumber: string; note?: string }) => ({
                url: '/wallet/withdraw', method: 'POST', body,
            }),
            invalidatesTags: ['Wallet'],
        }),

        // ── Owner ────────────────────────────────────
        getWalletRequests: builder.query({
            query: (params: { status?: string; type?: string; page?: number; limit?: number } | void) => ({
                url: '/wallet/requests',
                params: params || undefined,
            }),
            providesTags: ['Wallet'],
        }),
        approveWalletRequest: builder.mutation({
            query: (id: string) => ({ url: `/wallet/requests/${id}/approve`, method: 'PATCH' }),
            invalidatesTags: ['Wallet'],
        }),
        rejectWalletRequest: builder.mutation({
            query: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => ({
                url: `/wallet/requests/${id}/reject`, method: 'PATCH', body: { rejectionReason },
            }),
            invalidatesTags: ['Wallet'],
        }),
        setProfitRate: builder.mutation({
            query: ({ userId, profitRate }: { userId: string; profitRate: number }) => ({
                url: `/wallet/${userId}/profit-rate`, method: 'PATCH', body: { profitRate },
            }),
            invalidatesTags: ['Wallet'],
        }),
        runMonthlyProfit: builder.mutation({
            query: () => ({ url: '/wallet/run-profit', method: 'POST' }),
            invalidatesTags: ['Wallet'],
        }),
    }),
});

export const {
    useGetMyWalletQuery,
    useGetMyWalletTransactionsQuery,
    useRequestDepositMutation,
    useRequestWithdrawMutation,
    useGetWalletRequestsQuery,
    useApproveWalletRequestMutation,
    useRejectWalletRequestMutation,
    useSetProfitRateMutation,
    useRunMonthlyProfitMutation,
} = walletApi;
