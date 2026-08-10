"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LuSend, LuArrowLeft, LuMessageCircle, LuPackage, LuLoaderCircle, LuPaperclip, LuX } from 'react-icons/lu';
import { useAppSelector } from '@/redux';
import { getSocket } from '@/lib/socket';
import {
    useGetConversationsQuery,
    useGetMessagesQuery,
    useSendMessageMutation,
    useMarkConversationReadMutation,
} from '@/redux/api/chatApi';
import { useUploadImageMutation } from '@/redux/api/uploadApi';

interface Party { _id: string; firstName?: string; lastName?: string; avatar?: string; role?: string }
interface Conversation {
    _id: string;
    participants: Party[];
    company?: { name?: string; logo?: string; slug?: string } | null;
    product?: { name?: string; thumbnail?: string; slug?: string } | null;
    lastMessage?: string;
    lastMessageAt?: string;
    myUnread?: number;
}
interface ChatMessage {
    _id: string;
    sender: Party | string;
    text?: string;
    attachments?: string[];
    orderRequest?: { product?: { name?: string; thumbnail?: string }; quantity?: number; note?: string };
    createdAt: string;
}

// A picked image on its way to the CDN. `preview` is a local object URL so the
// thumbnail shows instantly; `url` only exists once the upload came back.
interface PendingAttachment {
    id: string;
    preview: string;
    status: 'uploading' | 'done' | 'error';
    url?: string;
}

// Riders and shopkeepers are on slow mobile data — reject the 12 MP camera
// original here rather than letting it stall the thread for a minute.
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const timeOf = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    return sameDay
        ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

function MessagesClient() {
    const { isAuthenticated, user } = useAppSelector((s) => s.auth);
    const params = useSearchParams();
    const [activeId, setActiveId] = useState<string>('');
    const [draft, setDraft] = useState('');
    const [pending, setPending] = useState<PendingAttachment[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingRef = useRef<PendingAttachment[]>([]);

    const { data: convRes, isLoading: convLoading, refetch: refetchConversations } =
        useGetConversationsQuery(undefined, { skip: !isAuthenticated });
    const conversations: Conversation[] = convRes?.data?.conversations || [];

    // `isAuthenticated` matters as much as `activeId`: /messages?c=<id> sets the
    // thread straight from the URL, so without this guard a signed-out visitor
    // following a "Message supplier" link fires a 401, trips the global
    // session-expired interceptor and lands on /login — instead of the sign-in
    // card below.
    const { data: msgRes, isFetching: msgLoading, refetch: refetchMessages } =
        useGetMessagesQuery({ id: activeId }, { skip: !activeId || !isAuthenticated });
    const messages: ChatMessage[] = useMemo(() => msgRes?.data || [], [msgRes]);

    const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
    const [markRead] = useMarkConversationReadMutation();
    const [uploadImage] = useUploadImageMutation();

    // Deep link: /messages?c=<id> opens that thread (used by "Message supplier").
    useEffect(() => {
        const c = params.get('c');
        if (c) setActiveId(c);
    }, [params]);

    // Open the newest thread on a wide screen so the pane is never empty.
    useEffect(() => {
        if (!activeId && conversations.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
            setActiveId(conversations[0]._id);
        }
    }, [conversations, activeId]);

    // Live delivery. The server pushes to a per-conversation room, so joining
    // the open thread is what makes an incoming message appear without a poll.
    useEffect(() => {
        if (!activeId || !isAuthenticated) return;
        const socket = getSocket();
        if (!socket) return;

        socket.emit('conversation:join', activeId);
        const onNew = () => { refetchMessages(); refetchConversations(); };
        socket.on('message:new', onNew);

        return () => {
            socket.emit('conversation:leave', activeId);
            socket.off('message:new', onNew);
        };
    }, [activeId, isAuthenticated, refetchMessages, refetchConversations]);

    useEffect(() => {
        if (activeId && isAuthenticated) markRead(activeId);
    }, [activeId, isAuthenticated, messages.length, markRead]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, pending.length]);

    useEffect(() => { pendingRef.current = pending; }, [pending]);

    // Picked photos belong to the thread they were picked in — drop them (and
    // free the object URLs) when the user switches threads or leaves the page.
    useEffect(() => () => {
        pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
        setPending([]);
    }, [activeId]);

    const active = conversations.find((c) => c._id === activeId);
    const otherParty = (c?: Conversation) =>
        c?.participants?.find((p) => String(p._id) !== String(user?._id));

    const titleOf = (c?: Conversation) => {
        if (c?.company?.name) return c.company.name;
        const other = otherParty(c);
        return other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() || 'Conversation' : 'Conversation';
    };

    const uploading = pending.some((p) => p.status === 'uploading');
    const readyCount = pending.filter((p) => p.status === 'done' && p.url).length;
    const canSend = !!activeId && !uploading && !sending && (!!draft.trim() || readyCount > 0);

    const removePending = (id: string) => {
        const hit = pendingRef.current.find((p) => p.id === id);
        if (hit) URL.revokeObjectURL(hit.preview);
        setPending((prev) => prev.filter((p) => p.id !== id));
    };

    const handleFiles = (list: FileList | null) => {
        const files = Array.from(list || []);
        // Reset the input so picking the same photo twice still fires onChange.
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (files.length === 0) return;

        files.forEach((file) => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image`);
                return;
            }
            if (file.size > MAX_ATTACHMENT_BYTES) {
                toast.error(`${file.name} is over 5 MB — please send a smaller photo`);
                return;
            }

            const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            setPending((prev) => [...prev, { id, preview: URL.createObjectURL(file), status: 'uploading' as const }]);

            // Fire and forget: the composer stays live while the bytes go up, so a
            // slow upload never blocks typing.
            const form = new FormData();
            form.append('image', file);
            uploadImage(form)
                .unwrap()
                .then((res) => {
                    const url = res?.data?.url;
                    if (!url) throw new Error('upload returned no url');
                    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'done' as const, url } : p)));
                })
                .catch(() => {
                    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'error' as const } : p)));
                    toast.error(`Could not upload ${file.name}`);
                });
        });
    };

    const handleSend = async () => {
        const text = draft.trim();
        if (!activeId || uploading || sending) return;

        const ready = pending.filter((p) => p.status === 'done' && p.url);
        if (!text && ready.length === 0) return;
        const attachments = ready.map((p) => p.url as string);

        // Clear the composer optimistically, but keep what we cleared so a failed
        // send can put it back verbatim instead of losing the message.
        setDraft('');
        setPending((prev) => prev.filter((p) => p.status !== 'done'));
        try {
            await sendMessage({
                id: activeId,
                ...(text ? { text } : {}),
                ...(attachments.length ? { attachments } : {}),
            }).unwrap();
            ready.forEach((p) => URL.revokeObjectURL(p.preview));
        } catch {
            setDraft(text);
            setPending((prev) => [...ready, ...prev]);
            toast.error('Could not send — please try again');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center max-w-sm w-full">
                    <LuMessageCircle size={32} className="mx-auto mb-3 text-gray-300" />
                    <h1 className="text-lg font-bold text-gray-900 mb-1">Your messages</h1>
                    <p className="text-sm text-gray-500 mb-5">
                        Sign in to chat with suppliers and your local dealer.
                    </p>
                    <Link
                        href="/login?redirect=/messages"
                        className="inline-block px-6 py-2.5 rounded-lg text-white text-sm font-semibold"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex h-[calc(100dvh-190px)] min-h-[420px]">
                {/* ── Thread list ── */}
                <aside className={`w-full md:w-[320px] border-r border-gray-100 overflow-y-auto ${activeId ? 'hidden md:block' : 'block'}`}>
                    {convLoading ? (
                        <div className="p-4 space-y-3">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <LuMessageCircle size={28} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm font-semibold text-gray-600">No conversations yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Message a supplier from their page, or your dealer from the dealer directory.
                            </p>
                            <Link href="/companies" className="inline-block mt-4 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                                Browse companies →
                            </Link>
                        </div>
                    ) : (
                        conversations.map((c) => (
                            <button
                                key={c._id}
                                onClick={() => setActiveId(c._id)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${activeId === c._id ? 'bg-gray-50' : ''}`}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold text-gray-900 truncate">{titleOf(c)}</span>
                                            <span className="text-[10px] text-gray-400 shrink-0">{timeOf(c.lastMessageAt)}</span>
                                        </div>
                                        {c.product?.name && (
                                            <span className="block text-[11px] text-gray-400 truncate">about {c.product.name}</span>
                                        )}
                                        <span className="block text-xs text-gray-500 truncate mt-0.5">{c.lastMessage || 'No messages yet'}</span>
                                    </div>
                                    {!!c.myUnread && c.myUnread > 0 && (
                                        <span
                                            className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white grid place-items-center"
                                            style={{ background: 'var(--color-primary)' }}
                                        >
                                            {c.myUnread}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </aside>

                {/* ── Thread ── */}
                <section className={`flex-1 flex flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}>
                    {!activeId ? (
                        <div className="flex-1 grid place-items-center text-sm text-gray-400">
                            Pick a conversation
                        </div>
                    ) : (
                        <>
                            <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
                                <button
                                    onClick={() => setActiveId('')}
                                    className="md:hidden w-9 h-9 -ml-1 rounded-full hover:bg-gray-100 grid place-items-center"
                                    aria-label="Back to conversations"
                                >
                                    <LuArrowLeft size={18} />
                                </button>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{titleOf(active)}</p>
                                    {active?.product?.name && (
                                        <p className="text-[11px] text-gray-400 truncate">about {active.product.name}</p>
                                    )}
                                </div>
                            </header>

                            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2.5" style={{ background: '#f7f8fa' }}>
                                {msgLoading && messages.length === 0 ? (
                                    <div className="h-full grid place-items-center text-gray-300">
                                        <LuLoaderCircle size={22} className="animate-spin" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <p className="text-center text-xs text-gray-400 py-8">
                                        Say hello — this is the start of the conversation.
                                    </p>
                                ) : (
                                    messages.map((m) => {
                                        const senderId = typeof m.sender === 'string' ? m.sender : m.sender?._id;
                                        const mine = String(senderId) === String(user?._id);
                                        const files = Array.isArray(m.attachments) ? m.attachments.filter(Boolean) : [];
                                        const hasText = !!m.text?.trim();
                                        const hasChrome = hasText || !!m.orderRequest?.product;
                                        return (
                                            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                <div className="max-w-[82%] sm:max-w-[70%]">
                                                    <div
                                                        className={`text-[13px] leading-relaxed whitespace-pre-line ${hasChrome ? 'px-3.5 py-2.5' : 'p-1.5'}`}
                                                        style={
                                                            mine
                                                                ? { background: 'var(--color-primary)', color: '#fff', borderRadius: '14px 14px 4px 14px' }
                                                                : { background: '#fff', color: '#374151', borderRadius: '14px 14px 14px 4px', border: '1px solid #eef0f2' }
                                                        }
                                                    >
                                                        {m.orderRequest?.product && (
                                                            <span className={`flex items-center gap-1.5 text-[11px] font-semibold mb-1 ${mine ? 'text-white/80' : 'text-gray-500'}`}>
                                                                <LuPackage size={12} />
                                                                Order request · {m.orderRequest.product.name} × {m.orderRequest.quantity}
                                                            </span>
                                                        )}
                                                        {files.length > 0 && (
                                                            <span className={`flex flex-col gap-1.5 ${hasText ? 'mb-1.5' : ''}`}>
                                                                {files.map((src, i) => (
                                                                    <a
                                                                        key={`${m._id}-att-${i}`}
                                                                        href={src}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="block w-fit"
                                                                    >
                                                                        <img
                                                                            src={src}
                                                                            alt="Attachment"
                                                                            loading="lazy"
                                                                            className="w-full max-w-[220px] rounded-lg bg-gray-100"
                                                                        />
                                                                    </a>
                                                                ))}
                                                            </span>
                                                        )}
                                                        {m.text}
                                                    </div>
                                                    <span className={`block text-[10px] text-gray-400 mt-0.5 ${mine ? 'text-right' : ''}`}>
                                                        {timeOf(m.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-2.5">
                                {pending.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2.5">
                                        {pending.map((p) => (
                                            <div
                                                key={p.id}
                                                className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                                            >
                                                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                                                {p.status === 'uploading' && (
                                                    <span className="absolute inset-0 grid place-items-center bg-black/45 text-white">
                                                        <LuLoaderCircle size={18} className="animate-spin" />
                                                    </span>
                                                )}
                                                {p.status === 'error' && (
                                                    <span className="absolute inset-0 grid place-items-center bg-red-500/75 px-1 text-[10px] font-semibold leading-tight text-center text-white">
                                                        Upload failed
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removePending(p.id)}
                                                    aria-label="Remove attachment"
                                                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center hover:bg-black/80 transition-colors"
                                                >
                                                    <LuX size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => handleFiles(e.target.files)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        aria-label="Attach photos"
                                        className="w-11 h-11 rounded-full grid place-items-center shrink-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                    >
                                        <LuPaperclip size={18} />
                                    </button>
                                    <input
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder="Type a message…"
                                        className="flex-1 min-w-0 text-[13px] px-3.5 py-2.5 rounded-full bg-gray-100 outline-none focus:bg-white focus:ring-2 transition-all"
                                        style={{ ['--tw-ring-color' as string]: 'rgba(var(--color-primary-rgb),0.3)' } as React.CSSProperties}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!canSend}
                                        aria-label="Send message"
                                        className="w-11 h-11 rounded-full grid place-items-center text-white shrink-0 transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                                        style={{ background: 'var(--color-primary)' }}
                                    >
                                        {uploading || sending ? <LuLoaderCircle size={16} className="animate-spin" /> : <LuSend size={16} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

/**
 * `useSearchParams` (the ?c=<id> deep link) opts this route out of prerendering,
 * and Next refuses to build that without a boundary to fall back to. Same shape
 * as every other search-param page here — /products, /shop, /track.
 */
export default function MessagesPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5">
                    <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
                    <div className="min-h-[60vh] flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
                    </div>
                </div>
            }
        >
            <MessagesClient />
        </Suspense>
    );
}
