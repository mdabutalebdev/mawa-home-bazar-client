import { baseApi } from './baseApi';

export interface GeoArea {
    _id: string;
    name: string;
    bnName: string;
    slug: string;
    isActive?: boolean;
}

export interface GeoUpazila extends GeoArea {
    district: string | GeoArea;
    division: string | GeoArea;
    hasDealer?: boolean;
    homeDeliveryAvailable?: boolean;
}

export const geoApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public: 8 divisions — GET /api/geo/divisions
        getDivisions: builder.query({
            query: () => '/geo/divisions',
            providesTags: ['Geo'],
        }),
        // Public: districts, optionally of one division — GET /api/geo/districts?division=
        getDistricts: builder.query({
            query: (params: { division?: string } | void) => ({
                url: '/geo/districts',
                params: params || undefined,
            }),
            providesTags: ['Geo'],
        }),
        // Public: upazilas of a district/division — GET /api/geo/upazilas?district=&hasDealer=
        getUpazilas: builder.query({
            query: (params: { district?: string; division?: string; hasDealer?: boolean } | void) => ({
                url: '/geo/upazilas',
                params: params || undefined,
            }),
            providesTags: ['Geo'],
        }),
        // Public: free-text area search — GET /api/geo/upazilas/search?q=
        searchUpazilas: builder.query({
            query: (q: string) => ({ url: '/geo/upazilas/search', params: { q } }),
            providesTags: ['Geo'],
        }),
        // Public: one upazila with district/division resolved — GET /api/geo/upazilas/:id
        getUpazilaById: builder.query({
            query: (id: string) => `/geo/upazilas/${id}`,
            providesTags: ['Geo'],
        }),
        // Public: dealer coverage summary — GET /api/geo/coverage
        getGeoCoverage: builder.query({
            query: () => '/geo/coverage',
            providesTags: ['Geo'],
        }),
        // Admin: re-seed after a data correction — POST /api/geo/reseed
        reseedGeo: builder.mutation({
            query: () => ({ url: '/geo/reseed', method: 'POST' }),
            invalidatesTags: ['Geo'],
        }),
    }),
});

export const {
    useGetDivisionsQuery,
    useGetDistrictsQuery,
    useGetUpazilasQuery,
    useSearchUpazilasQuery,
    useGetUpazilaByIdQuery,
    useGetGeoCoverageQuery,
    useReseedGeoMutation,
} = geoApi;
