import { baseApi } from './baseApi';

export const marketingApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        applyMarketingOfficer: builder.mutation({
            query: (data) => ({ url: '/marketing-officers/apply', method: 'POST', body: data }),
            invalidatesTags: ['Partners'],
        }),
        getMyMarketingOfficer: builder.query({
            query: () => '/marketing-officers/me',
            providesTags: ['Partners'],
        }),
        updateMyMarketingOfficer: builder.mutation({
            query: (data) => ({ url: '/marketing-officers/me', method: 'PATCH', body: data }),
            invalidatesTags: ['Partners'],
        }),

        // ── Daily reports (officer) ──────────────────────────────
        saveDailyReport: builder.mutation({
            query: (data) => ({ url: '/marketing-officers/reports', method: 'POST', body: data }),
            invalidatesTags: ['MarketingReports'],
        }),
        checkIn: builder.mutation({
            query: (data: { lat: number; lng: number; address?: string }) => ({
                url: '/marketing-officers/reports/check-in', method: 'POST', body: data,
            }),
            invalidatesTags: ['MarketingReports'],
        }),
        checkOut: builder.mutation({
            query: (data: { lat: number; lng: number; address?: string }) => ({
                url: '/marketing-officers/reports/check-out', method: 'POST', body: data,
            }),
            invalidatesTags: ['MarketingReports'],
        }),
        addVisit: builder.mutation({
            query: (data) => ({ url: '/marketing-officers/reports/visits', method: 'POST', body: data }),
            invalidatesTags: ['MarketingReports'],
        }),
        getMyReports: builder.query({
            query: (params: { from?: string; to?: string; page?: number; limit?: number } | void) => ({
                url: '/marketing-officers/reports/my',
                params: params || undefined,
            }),
            providesTags: ['MarketingReports'],
        }),

        // ── Owner view ───────────────────────────────────────────
        getMarketingOfficers: builder.query({
            query: (params: { status?: string; page?: number; limit?: number } | void) => ({
                url: '/marketing-officers',
                params: params || undefined,
            }),
            providesTags: ['Partners'],
        }),
        getAllReports: builder.query({
            query: (params: { officer?: string; from?: string; to?: string; page?: number; limit?: number } | void) => ({
                url: '/marketing-officers/reports',
                params: params || undefined,
            }),
            providesTags: ['MarketingReports'],
        }),
        getOfficerPerformance: builder.query({
            query: ({ id, from, to }: { id: string; from?: string; to?: string }) => ({
                url: `/marketing-officers/${id}/performance`,
                params: { from, to },
            }),
            providesTags: ['MarketingReports'],
        }),
        approveMarketingOfficer: builder.mutation({
            query: (id: string) => ({ url: `/marketing-officers/${id}/approve`, method: 'PATCH' }),
            invalidatesTags: ['Partners'],
        }),
        rejectMarketingOfficer: builder.mutation({
            query: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => ({
                url: `/marketing-officers/${id}/reject`, method: 'PATCH', body: { rejectionReason },
            }),
            invalidatesTags: ['Partners'],
        }),
        suspendMarketingOfficer: builder.mutation({
            query: (id: string) => ({ url: `/marketing-officers/${id}/suspend`, method: 'PATCH' }),
            invalidatesTags: ['Partners'],
        }),
    }),
});

export const {
    useApplyMarketingOfficerMutation,
    useGetMyMarketingOfficerQuery,
    useUpdateMyMarketingOfficerMutation,
    useSaveDailyReportMutation,
    useCheckInMutation,
    useCheckOutMutation,
    useAddVisitMutation,
    useGetMyReportsQuery,
    useGetMarketingOfficersQuery,
    useGetAllReportsQuery,
    useGetOfficerPerformanceQuery,
    useApproveMarketingOfficerMutation,
    useRejectMarketingOfficerMutation,
    useSuspendMarketingOfficerMutation,
} = marketingApi;
