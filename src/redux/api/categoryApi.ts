import { baseApi } from './baseApi';

export const categoryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public: get all categories — Backend route: GET /api/categories/
        getCategories: builder.query({
            query: (params) => ({
                url: '/categories',
                params,
            }),
            providesTags: ['Categories'],
        }),
        // Admin: get all categories (admin view) — Backend route: GET /api/categories/admin/all
        getAdminCategories: builder.query({
            query: () => '/categories/admin/all',
            providesTags: ['Categories'],
        }),
        // Public: get category by id — Backend route: GET /api/categories/:id
        getCategoryById: builder.query({
            query: (id) => `/categories/${id}`,
            providesTags: (result, error, id) => [{ type: 'Categories', id }],
        }),
        // Admin: create category — Backend route: POST /api/categories/
        createCategory: builder.mutation({
            query: (data) => ({
                url: '/categories',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Categories'],
        }),
        // Admin: update category — Backend route: PATCH /api/categories/:id
        updateCategory: builder.mutation({
            query: ({ id, data }) => ({
                url: `/categories/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => ['Categories', { type: 'Categories', id }],
        }),
        // Admin: delete category — Backend route: DELETE /api/categories/:id
        deleteCategory: builder.mutation({
            query: (id) => ({
                url: `/categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Categories'],
        }),

        // ── Company-scoped categories ──
        // Categories a seller may pick when uploading a product: global + own.
        getSellerCategories: builder.query({
            query: () => '/categories/for-seller',
            providesTags: ['Categories'],
        }),
        // A company's own categories (for its dashboard).
        getMyCompanyCategories: builder.query({
            query: () => '/categories/company/mine',
            providesTags: ['Categories'],
        }),
        createCompanyCategory: builder.mutation({
            query: (data) => ({ url: '/categories/company', method: 'POST', body: data }),
            invalidatesTags: ['Categories'],
        }),
        updateCompanyCategory: builder.mutation({
            query: ({ id, data }) => ({ url: `/categories/company/${id}`, method: 'PATCH', body: data }),
            invalidatesTags: ['Categories'],
        }),
        deleteCompanyCategory: builder.mutation({
            query: (id) => ({ url: `/categories/company/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Categories'],
        }),
    }),
});

export const {
    useGetCategoriesQuery,
    useGetAdminCategoriesQuery,
    useGetCategoryByIdQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useGetSellerCategoriesQuery,
    useGetMyCompanyCategoriesQuery,
    useCreateCompanyCategoryMutation,
    useUpdateCompanyCategoryMutation,
    useDeleteCompanyCategoryMutation,
} = categoryApi;
