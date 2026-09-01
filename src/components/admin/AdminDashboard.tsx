"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LuShoppingBag, LuShoppingCart, LuUsers,
    LuArrowRight, LuRefreshCw, LuPackage, LuTrendingUp,
    LuPhone, LuClock, LuPlus, LuCircleCheck, LuTruck,
    LuStar, LuTag, LuWallet, LuBanknote, LuInbox,
} from 'react-icons/lu';
import {
    useGetDashboardSummaryQuery,
    useGetRecentOrdersQuery,
    useGetTopProductsQuery,
    useGetSalesByCategoryQuery,
    useGetMonthlyRevenueQuery,
} from '@/redux/api/dashboardApi';
import { useGetOrderStatsQuery } from '@/redux/api/orderApi';
import { getSocket } from '@/lib/socket';

// ── Shared design tokens — one card look, one rhythm, everywhere ──
const CARD = 'rounded-2xl border border-gray-200/70 bg-white shadow-sm';

// Status → pill classes. One source of truth for every order-status chip.
const STATUS_PILL: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70',
    confirmed: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    processing: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/70',
    shipped: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/70',
    on_the_way: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/70',
    out_for_delivery: 'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200/70',
    delivery_attempt: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200/70',
    delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70',
    cancelled: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70',
    returned: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200',
    refunded: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200',
};
const pill = (s: string) => STATUS_PILL[s] || 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200';

const statusIcon = (status: string, size = 15) => {
    if (status === 'pending') return <LuClock size={size} />;
    if (status === 'shipped' || status === 'on_the_way' || status === 'out_for_delivery') return <LuTruck size={size} />;
    if (status === 'delivered') return <LuCircleCheck size={size} />;
    return <LuShoppingCart size={size} />;
};

const AdminDashboard: React.FC = () => {
    const router = useRouter();

    const {
        data: summaryData,
        isLoading,
        refetch: refetchSummary,
    } = useGetDashboardSummaryQuery(undefined, { pollingInterval: 30000 });

    const { data: ordersData, refetch: refetchOrders } = useGetRecentOrdersQuery(8);
    const { data: productsData } = useGetTopProductsQuery(5);
    const { data: categoryData } = useGetSalesByCategoryQuery(undefined);
    const { data: orderStatsData, refetch: refetchStats } = useGetOrderStatsQuery(undefined);
    const { data: monthlyData, refetch: refetchMonthly } = useGetMonthlyRevenueQuery(undefined);

    const handleRefresh = () => { refetchSummary(); refetchOrders(); refetchStats(); refetchMonthly(); };

    // Real-time: refresh money/order figures the instant the backend broadcasts.
    React.useEffect(() => {
        const socket = getSocket();
        if (!socket) return;
        const onUpdate = () => { refetchSummary(); refetchOrders(); refetchStats(); refetchMonthly(); };
        socket.on('finance:update', onUpdate);
        return () => { socket.off('finance:update', onUpdate); };
    }, [refetchSummary, refetchOrders, refetchStats, refetchMonthly]);

    const stats = summaryData?.data || null;
    const recentOrders = ordersData?.data || [];
    const topProducts = productsData?.data || [];
    const salesByCategory = categoryData?.data || [];
    const orderStats = orderStatsData?.data || {};
    const monthly: any[] = monthlyData?.data || [];

    const formatCurrency = (amount: number) => `৳${(amount || 0).toLocaleString()}`;

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const catColors = ['var(--color-primary)', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444', '#10B981'];

    // ── KPI cards — a solid, vibrant colour per metric, white text on top ──
    const kpis = [
        { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), sub: `Today ${formatCurrency(stats?.todayRevenue || 0)}`, icon: LuTrendingUp, color: '#059669', live: true },
        { label: 'Net Profit', value: formatCurrency(stats?.netProfit || 0), sub: `${Math.round((stats?.profitMargin || 0) * 100)}% margin`, icon: LuWallet, color: '#0D9488', live: true },
        { label: 'Avg Order Value', value: formatCurrency(Math.round(stats?.avgOrderValue || 0)), sub: `${(stats?.paidOrders || 0).toLocaleString()} paid orders`, icon: LuBanknote, color: '#7C3AED', live: true },
        { label: 'Total Orders', value: (stats?.totalOrders || 0).toLocaleString(), sub: `${orderStats.pending || 0} pending`, icon: LuShoppingCart, color: '#2563EB' },
        { label: 'Customers', value: (stats?.totalCustomers || 0).toLocaleString(), sub: 'Registered users', icon: LuUsers, color: '#DB2777' },
        { label: 'Products', value: (stats?.totalProducts || 0).toLocaleString(), sub: 'In catalog', icon: LuShoppingBag, color: '#EA580C' },
        { label: "Today's Orders", value: (stats?.todayOrders || 0).toLocaleString(), sub: `${stats?.deliveredOrders || 0} delivered total`, icon: LuPackage, color: '#0891B2' },
        { label: 'Delivered', value: (stats?.deliveredOrders || 0).toLocaleString(), sub: 'Completed orders', icon: LuCircleCheck, color: '#15803D' },
    ];

    const pipeline = [
        { key: 'pending', label: 'Pending', value: orderStats.pending || 0 },
        { key: 'confirmed', label: 'Confirmed', value: orderStats.confirmed || 0 },
        { key: 'processing', label: 'Processing', value: orderStats.processing || 0 },
        { key: 'shipped', label: 'Shipped', value: orderStats.shipped || 0 },
        { key: 'delivered', label: 'Delivered', value: orderStats.delivered || 0 },
        { key: 'cancelled', label: 'Cancelled', value: orderStats.cancelled || 0 },
    ];

    const quickActions = [
        { label: 'Add Product', href: '/dashboard/admin/products/new', icon: LuPlus, bg: 'var(--color-primary-lightest)', fg: 'var(--color-primary)' },
        { label: 'All Orders', href: '/dashboard/admin/orders', icon: LuShoppingCart, bg: '#EFF6FF', fg: '#2563EB' },
        { label: 'Shipping', href: '/dashboard/admin/shipping', icon: LuTruck, bg: '#FFFBEB', fg: '#D97706' },
        { label: 'Reports', href: '/dashboard/admin/analytics', icon: LuTrendingUp, bg: '#F5F3FF', fg: '#7C3AED' },
        { label: 'Coupons', href: '/dashboard/admin/coupons', icon: LuTag, bg: '#FDF2F8', fg: '#DB2777' },
        { label: 'Reviews', href: '/dashboard/admin/reviews', icon: LuStar, bg: '#ECFEFF', fg: '#0891B2' },
    ];

    return (
        <div className="space-y-5">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-[22px] sm:text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-[13px] text-gray-500">Welcome back — here&apos;s what&apos;s happening with your store.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                >
                    <LuRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>

            {/* ── KPI grid — 8 metrics, each a solid jewel-tone card ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <div
                        key={i}
                        className="rounded-2xl p-4 sm:p-5 shadow-sm"
                        style={{ background: k.color }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white ring-1 ring-inset ring-white/25">
                                <k.icon size={18} />
                            </span>
                            {k.live && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-inset ring-white/20">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                                    Live
                                </span>
                            )}
                        </div>
                        {isLoading ? (
                            <div className="mt-4 h-7 w-24 animate-pulse rounded-md bg-white/25" />
                        ) : (
                            <p className="mt-4 text-[26px] font-bold leading-none tracking-tight text-white">{k.value}</p>
                        )}
                        <p className="mt-2 text-[13px] font-semibold text-white/90">{k.label}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-white/75">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Order pipeline ── */}
            <div className={`${CARD} p-4 sm:p-5`}>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-gray-900">Order Pipeline</h3>
                    <Link href="/dashboard/admin/orders" className="text-[12px] font-semibold text-[var(--color-primary)] hover:underline">Manage</Link>
                </div>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                    {pipeline.map((p) => (
                        <Link
                            key={p.key}
                            href={`/dashboard/admin/orders?status=${p.key}`}
                            className={`flex flex-col items-center justify-center rounded-xl px-2 py-3 text-center transition-transform hover:-translate-y-0.5 ${pill(p.key)}`}
                        >
                            <span className="text-xl font-bold leading-none">{p.value}</span>
                            <span className="mt-1 text-[11px] font-semibold">{p.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Main split: chart + orders  |  quick actions + top products ── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">

                {/* LEFT */}
                <div className="min-w-0 space-y-5">

                    {/* Revenue chart */}
                    <div className={`${CARD} p-4 sm:p-5`}>
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h3 className="text-[15px] font-semibold text-gray-900">Revenue Overview</h3>
                                <p className="mt-0.5 text-[12px] text-gray-400">Last 12 months</p>
                            </div>
                            <div className="flex gap-4 text-[11px] font-semibold text-gray-500">
                                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" /> Revenue</span>
                                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Orders</span>
                            </div>
                        </div>

                        {(() => {
                            const map: Record<string, any> = {};
                            monthly.forEach((p: any) => { map[`${p.month}-${p.year}`] = p; });
                            const now = new Date();
                            const series = Array.from({ length: 12 }, (_, k) => {
                                const d = new Date(now.getFullYear(), now.getMonth() - (11 - k), 1);
                                const label = d.toLocaleString('en-US', { month: 'short' });
                                const e = map[`${label}-${d.getFullYear()}`];
                                return { label, revenue: e?.revenue || 0, orders: e?.orders || 0 };
                            });
                            const totalRev = series.reduce((s, m) => s + m.revenue, 0);
                            const totalOrd = series.reduce((s, m) => s + m.orders, 0);
                            const thisMonthRev = series[series.length - 1].revenue;
                            const aov = totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0;

                            const niceMax = (v: number) => { if (v <= 0) return 1000; const pow = Math.pow(10, Math.floor(Math.log10(v))); const nrm = v / pow; const st = nrm <= 1 ? 1 : nrm <= 2 ? 2 : nrm <= 5 ? 5 : 10; return st * pow; };
                            const maxRev = niceMax(Math.max(...series.map(m => m.revenue), 1));
                            const maxOrd = Math.max(...series.map(m => m.orders), 1);

                            const W = 640, H = 200, padL = 46, padR = 12, padT = 12, padB = 26;
                            const cw = W - padL - padR, ch = H - padT - padB, n = series.length;
                            const baseY = padT + ch;
                            const x = (i: number) => padL + (cw * i) / (n - 1);
                            const yRev = (v: number) => padT + ch - (v / maxRev) * ch;
                            const yOrd = (v: number) => padT + ch - (v / maxOrd) * ch;
                            const revPts = series.map((m, i) => ({ x: x(i), y: yRev(m.revenue) }));
                            const ordPts = series.map((m, i) => ({ x: x(i), y: yOrd(m.orders) }));
                            const smooth = (P: { x: number; y: number }[]) => {
                                if (P.length < 2) return '';
                                let d = `M ${P[0].x} ${P[0].y}`;
                                for (let i = 0; i < P.length - 1; i++) {
                                    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
                                    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
                                    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
                                    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
                                }
                                return d;
                            };
                            const revLine = smooth(revPts);
                            const revArea = `${revLine} L ${revPts[n - 1].x} ${baseY} L ${revPts[0].x} ${baseY} Z`;
                            const ordLine = smooth(ordPts);
                            const ticks = [1, 0.75, 0.5, 0.25, 0];
                            const fmtTick = (v: number) => v >= 1000 ? `৳${Math.round(v / 1000)}K` : `৳${Math.round(v)}`;

                            return (
                                <>
                                    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block">
                                        <defs>
                                            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.20} />
                                                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        {ticks.map((g, gi) => {
                                            const yy = baseY - g * ch;
                                            return (
                                                <g key={gi}>
                                                    <line x1={padL} x2={W - padR} y1={yy} y2={yy} stroke="#f1f1f1" strokeWidth={1} strokeDasharray="4 5" />
                                                    <text x={padL - 10} y={yy + 3} textAnchor="end" fontSize={9} fill="#b8b8b8">{fmtTick(maxRev * g)}</text>
                                                </g>
                                            );
                                        })}
                                        <path d={revArea} fill="url(#revFill)" />
                                        <path d={revLine} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                                        <path d={ordLine} fill="none" stroke="#6366F1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
                                        {series.map((m, i) => (m.revenue > 0 ? <circle key={'r' + i} cx={x(i)} cy={yRev(m.revenue)} r={3} fill="#fff" stroke="var(--color-primary)" strokeWidth={2} /> : null))}
                                        {series.map((m, i) => (<text key={'t' + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="#a3a3a3">{m.label}</text>))}
                                    </svg>

                                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4">
                                        {[
                                            { label: 'This Month', value: formatCurrency(thisMonthRev), color: '#111827' },
                                            { label: 'Avg Order Value', value: formatCurrency(aov), color: '#111827' },
                                            { label: 'Total Orders', value: totalOrd.toLocaleString(), color: '#4F46E5' },
                                            { label: 'Total Revenue', value: formatCurrency(totalRev), color: 'var(--color-primary)' },
                                        ].map((c, i) => (
                                            <div key={i}>
                                                <p className="text-[11px] font-medium text-gray-400">{c.label}</p>
                                                <p className="mt-1 text-[16px] font-bold leading-none" style={{ color: c.color }}>{c.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* Recent orders — proper data table */}
                    <div className={`${CARD} overflow-hidden`}>
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[15px] font-semibold text-gray-900">Recent Orders</h3>
                                {recentOrders.length > 0 && (
                                    <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[11px] font-bold text-white">{recentOrders.length}</span>
                                )}
                            </div>
                            <Link href="/dashboard/admin/orders" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-primary)] hover:underline">
                                View all <LuArrowRight size={13} />
                            </Link>
                        </div>

                        {recentOrders.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                            <th className="px-5 py-3">Customer</th>
                                            <th className="px-5 py-3">Order</th>
                                            <th className="px-5 py-3">Status</th>
                                            <th className="px-5 py-3 text-right">Total</th>
                                            <th className="px-5 py-3 text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {recentOrders.map((order: any, i: number) => {
                                            const name = order.shippingAddress?.fullName || `${order.user?.firstName || 'Customer'} ${order.user?.lastName || ''}`.trim();
                                            return (
                                                <tr
                                                    key={order._id || i}
                                                    onClick={() => router.push(`/dashboard/admin/orders/${order._id}`)}
                                                    className="cursor-pointer transition-colors hover:bg-gray-50/70"
                                                >
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${pill(order.status)}`}>
                                                                {statusIcon(order.status, 15)}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-[13px] font-semibold text-gray-800">{name}</p>
                                                                {order.guestInfo?.phone && (
                                                                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                                                                        <LuPhone size={9} /> {order.guestInfo.phone}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 text-[12px] font-medium text-gray-500">
                                                        {order.orderId || order.orderNumber || '—'}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${pill(order.status)}`}>
                                                            {String(order.status || '').replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 text-right text-[13px] font-bold text-gray-900">
                                                        {formatCurrency(order.total)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 text-right text-[11px] text-gray-400">
                                                        {order.createdAt ? timeAgo(order.createdAt) : ''}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                                <LuInbox size={30} className="text-gray-200" />
                                <p className="mt-3 text-[13px] font-medium text-gray-400">No website orders yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT */}
                <div className="space-y-5">

                    {/* Quick actions */}
                    <div className={`${CARD} p-4 sm:p-5`}>
                        <h3 className="mb-3 text-[15px] font-semibold text-gray-900">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-2.5">
                            {quickActions.map((a, i) => (
                                <Link
                                    key={i}
                                    href={a.href}
                                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5"
                                    style={{ background: a.bg, color: a.fg }}
                                >
                                    <a.icon size={15} />
                                    {a.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Top products */}
                    <div className={`${CARD} p-4 sm:p-5`}>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-[15px] font-semibold text-gray-900">Top Products</h3>
                            <Link href="/dashboard/admin/products" className="text-[12px] font-semibold text-[var(--color-primary)] hover:underline">View all</Link>
                        </div>
                        <div className="space-y-2">
                            {topProducts.length > 0 ? topProducts.map((product: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                                        {product.thumbnail
                                            ? <img src={product.thumbnail} alt="" className="h-full w-full object-cover" />
                                            : <LuShoppingBag size={15} className="text-gray-300" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-semibold text-gray-800">{product.name}</p>
                                        <p className="text-[11px] text-gray-400">{formatCurrency(product.price)} · {product.stock || 0} in stock</p>
                                    </div>
                                    <span className="shrink-0 rounded-md bg-[var(--color-primary-lightest)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">#{i + 1}</span>
                                </div>
                            )) : (
                                <p className="py-8 text-center text-[12px] text-gray-400">No products yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sales by category ── */}
            <div className={`${CARD} p-4 sm:p-5`}>
                <h3 className="mb-4 text-[15px] font-semibold text-gray-900">Sales by Category</h3>
                {salesByCategory.length > 0 ? (
                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                        {salesByCategory.slice(0, 8).map((cat: any, i: number) => {
                            const totalSales = salesByCategory.reduce((sum: number, c: any) => sum + (c.count || c.totalSales || 0), 0);
                            const value = cat.count || cat.totalSales || 0;
                            const percentage = totalSales > 0 ? Math.round((value / totalSales) * 100) : 0;
                            const color = catColors[i % catColors.length];
                            return (
                                <div key={i}>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[12.5px] font-medium text-gray-600">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                                            {cat.name || cat.category || 'Other'}
                                        </span>
                                        <span className="text-[11px] font-bold text-gray-700">{percentage}% · {value}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percentage}%`, background: color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <LuShoppingBag size={26} className="text-gray-200" />
                        <p className="mt-2 text-[12px] text-gray-400">No category data yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
