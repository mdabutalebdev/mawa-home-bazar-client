import { baseApi } from './baseApi';

export const chatApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // My threads — GET /api/chat → { conversations, meta }; each carries `myUnread`.
        getConversations: builder.query({
            query: (params: { archived?: string; page?: number; limit?: number } | void) => ({
                url: '/chat',
                params: params || undefined,
            }),
            providesTags: ['Conversations'],
        }),
        // Open (or reuse) a thread — POST /api/chat/open
        // Pass `company` or `dealer` rather than a user id: the storefront knows
        // the business, not the person behind it.
        openConversation: builder.mutation({
            query: (body: {
                withUser?: string; company?: string; dealer?: string;
                product?: string; order?: string; type?: string;
            }) => ({ url: '/chat/open', method: 'POST', body }),
            invalidatesTags: ['Conversations'],
        }),
        getConversation: builder.query({
            query: (id: string) => `/chat/${id}`,
            providesTags: ['Conversations'],
        }),
        // Cursor-paged history — pass `before` (an ISO date) to load older messages.
        getMessages: builder.query({
            query: ({ id, before, limit }: { id: string; before?: string; limit?: number }) => ({
                url: `/chat/${id}/messages`,
                params: { before, limit },
            }),
            providesTags: ['Messages'],
        }),
        sendMessage: builder.mutation({
            query: ({ id, ...body }: {
                id: string; text?: string; attachments?: string[];
                orderRequest?: { product: string; quantity: number; note?: string };
            }) => ({ url: `/chat/${id}/messages`, method: 'POST', body }),
            invalidatesTags: ['Messages', 'Conversations'],
        }),
        markConversationRead: builder.mutation({
            query: (id: string) => ({ url: `/chat/${id}/read`, method: 'PATCH' }),
            invalidatesTags: ['Conversations'],
        }),
        getChatUnreadCount: builder.query({
            query: () => '/chat/unread-count',
            providesTags: ['Conversations'],
        }),
        archiveConversation: builder.mutation({
            query: ({ id, isArchived }: { id: string; isArchived: boolean }) => ({
                url: `/chat/${id}/archive`, method: 'PATCH', body: { isArchived },
            }),
            invalidatesTags: ['Conversations'],
        }),
    }),
});

export const {
    useGetConversationsQuery,
    useOpenConversationMutation,
    useGetConversationQuery,
    useGetMessagesQuery,
    useSendMessageMutation,
    useMarkConversationReadMutation,
    useGetChatUnreadCountQuery,
    useArchiveConversationMutation,
} = chatApi;
