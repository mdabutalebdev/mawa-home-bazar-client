import { baseApi } from './baseApi';

export const companyServiceApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getCompanyServices: builder.query({
            query: (params: any = {}) => {
                const queryStr = new URLSearchParams(params).toString();
                return {
                    url: `/company-services${queryStr ? `?${queryStr}` : ''}`,
                    method: 'GET',
                };
            },
            providesTags: ['companyService'],
        }),
        getAdminCompanyServices: builder.query({
            query: () => '/company-services/admin/all',
            providesTags: ['CompanyServices'],
        }),
        getMyCompanyServices: builder.query({
            query: () => '/company-services/company/my',
            providesTags: ['CompanyServices'],
        }),
        getCompanyServiceBySlug: builder.query({
            query: (slug) => `/company-services/slug/${slug}`,
            providesTags: (result, error, slug) => [{ type: 'CompanyServices', id: slug }],
        }),
        getCompanyServiceById: builder.query({
            query: (id) => `/company-services/${id}`,
            providesTags: (result, error, id) => [{ type: 'CompanyServices', id }],
        }),
        createCompanyService: builder.mutation({
            query: (data) => ({
                url: '/company-services',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['CompanyServices'],
        }),
        updateCompanyService: builder.mutation({
            query: ({ id, data }) => ({
                url: `/company-services/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['CompanyServices'],
        }),
        deleteCompanyService: builder.mutation({
            query: (id) => ({
                url: `/company-services/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['CompanyServices'],
        }),
    }),
});

export const {
    useGetCompanyServicesQuery,
    useGetAdminCompanyServicesQuery,
    useGetMyCompanyServicesQuery,
    useGetCompanyServiceBySlugQuery,
    useGetCompanyServiceByIdQuery,
    useCreateCompanyServiceMutation,
    useUpdateCompanyServiceMutation,
    useDeleteCompanyServiceMutation,
} = companyServiceApi;
