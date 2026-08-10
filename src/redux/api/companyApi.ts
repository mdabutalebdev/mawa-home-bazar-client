import { baseApi } from './baseApi';

export const companyApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public: approved companies — GET /api/companies/public
        getPublicCompanies: builder.query({
            query: (params: { q?: string; category?: string; type?: string; featured?: boolean; page?: number; limit?: number } | void) => ({
                url: '/companies/public',
                params: params || undefined,
            }),
            providesTags: ['Companies'],
        }),
        // Public: one company's storefront — GET /api/companies/public/:slug
        getCompanyBySlug: builder.query({
            query: (slug: string) => `/companies/public/${slug}`,
            providesTags: ['Companies'],
        }),
        applyCompany: builder.mutation({
            query: (data) => ({ url: '/companies/apply', method: 'POST', body: data }),
            invalidatesTags: ['Companies', 'Partners'],
        }),
        getMyCompany: builder.query({
            query: () => '/companies/me',
            providesTags: ['Companies', 'Partners'],
        }),
        updateMyCompany: builder.mutation({
            query: (data) => ({ url: '/companies/me', method: 'PATCH', body: data }),
            invalidatesTags: ['Companies', 'Partners'],
        }),
        // Admin
        getCompanies: builder.query({
            query: (params: { status?: string; page?: number; limit?: number } | void) => ({
                url: '/companies',
                params: params || undefined,
            }),
            providesTags: ['Companies'],
        }),
        getCompanyById: builder.query({
            query: (id: string) => `/companies/${id}`,
            providesTags: ['Companies'],
        }),
        approveCompany: builder.mutation({
            query: (id: string) => ({ url: `/companies/${id}/approve`, method: 'PATCH' }),
            invalidatesTags: ['Companies'],
        }),
        rejectCompany: builder.mutation({
            query: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => ({
                url: `/companies/${id}/reject`, method: 'PATCH', body: { rejectionReason },
            }),
            invalidatesTags: ['Companies'],
        }),
        suspendCompany: builder.mutation({
            query: (id: string) => ({ url: `/companies/${id}/suspend`, method: 'PATCH' }),
            invalidatesTags: ['Companies'],
        }),
        updateCompany: builder.mutation({
            query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
                url: `/companies/${id}`, method: 'PATCH', body: data,
            }),
            invalidatesTags: ['Companies'],
        }),

        // ── Company panel: own catalogue ──────────────
        // Every one of these scopes to the caller's own company on the server —
        // no company id is ever sent, so nothing here can reach a competitor's
        // catalogue. Response: data = { products, meta }.
        getMyCompanyProducts: builder.query({
            query: (params: { approvalStatus?: string; status?: string; q?: string; page?: number; limit?: number } | void) => ({
                url: '/products/company/my',
                params: params || undefined,
            }),
            providesTags: ['Products'],
        }),
        createMyCompanyProduct: builder.mutation({
            query: (data: Record<string, unknown>) => ({
                url: '/products/company/my', method: 'POST', body: data,
            }),
            invalidatesTags: ['Products'],
        }),
        updateMyCompanyProduct: builder.mutation({
            query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
                url: `/products/company/my/${id}`, method: 'PATCH', body: data,
            }),
            invalidatesTags: ['Products'],
        }),
        deleteMyCompanyProduct: builder.mutation({
            query: (id: string) => ({
                url: `/products/company/my/${id}`, method: 'DELETE',
            }),
            invalidatesTags: ['Products'],
        }),

        // ── Company panel: own orders ─────────────────
        // data = { orders, meta }; each order carries only this company's items
        // plus `myItemCount` / `mySubtotal`.
        getCompanyOrders: builder.query({
            query: (params: { status?: string; page?: number; limit?: number } | void) => ({
                url: '/orders/company/my',
                params: params || undefined,
            }),
            providesTags: ['Orders'],
        }),
        getCompanyOrderStats: builder.query({
            query: () => '/orders/company/stats',
            providesTags: ['Orders', 'Products'],
        }),
        updateCompanyOrderStatus: builder.mutation({
            query: ({ id, status, note }: { id: string; status: string; note?: string }) => ({
                url: `/orders/company/${id}/status`, method: 'PATCH', body: { status, note },
            }),
            invalidatesTags: ['Orders'],
        }),
    }),
});

export const {
    useGetPublicCompaniesQuery,
    useGetCompanyBySlugQuery,
    useApplyCompanyMutation,
    useGetMyCompanyQuery,
    useUpdateMyCompanyMutation,
    useGetCompaniesQuery,
    useGetCompanyByIdQuery,
    useApproveCompanyMutation,
    useRejectCompanyMutation,
    useSuspendCompanyMutation,
    useUpdateCompanyMutation,
    // Company panel — catalogue
    useGetMyCompanyProductsQuery,
    useCreateMyCompanyProductMutation,
    useUpdateMyCompanyProductMutation,
    useDeleteMyCompanyProductMutation,
    // Company panel — orders
    useGetCompanyOrdersQuery,
    useGetCompanyOrderStatsQuery,
    useUpdateCompanyOrderStatusMutation,
} = companyApi;
