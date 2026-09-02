"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuPlus,
    LuSquarePen,
    LuTrash2,
    LuSearch,
    LuFilter,
    LuShoppingBag,
    LuEye,
    LuEllipsisVertical,
    LuBox,
    LuChartColumn,
    LuCloudUpload
} from 'react-icons/lu';
import {
    useGetProductsQuery,
    useDeleteProductMutation
} from '@/redux/api/productApi';
import { toast } from 'react-hot-toast';
import BulkUploadModal from './BulkUploadModal';

const ProductsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const { data: productsData, isLoading, refetch } = useGetProductsQuery({
        searchTerm: searchTerm || undefined,
        page: page,
        limit: 10
    });
    const [deleteProduct] = useDeleteProductMutation();

    const products = productsData?.data || [];
    const meta = productsData?.meta || {};

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id).unwrap();
                toast.success('Product deleted successfully');
            } catch (error: any) {
                toast.error(error?.data?.message || 'Failed to delete product');
            }
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-md border border-gray-200">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">Products Management</h1>
                    <p className="text-[13px] text-gray-500 mt-1">Manage your inventory, pricing and product visibility</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowBulkUpload(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-all"
                    >
                        <LuCloudUpload size={18} />
                        Bulk Upload (CSV)
                    </button>
                    <Link
                        href="/dashboard/admin/products/new"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white rounded-md text-sm font-medium hover:bg-[#4338CA] transition-all"
                    >
                        <LuPlus size={18} />
                        Add New Product
                    </Link>
                </div>
            </div>

            {showBulkUpload && <BulkUploadModal onClose={() => setShowBulkUpload(false)} />}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Products', value: meta.total || 0, icon: LuShoppingBag, color: 'blue' },
                    { label: 'Active', value: products.filter((p: any) => p.status === 'active').length, icon: LuBox, color: 'green' },
                    { label: 'Low Stock', value: products.filter((p: any) => (p.stock ?? 0) <= (p.lowStockThreshold ?? 5)).length, icon: LuChartColumn, color: 'orange' },
                    { label: 'Featured', value: products.filter((p: any) => p.isFeatured).length, icon: LuEye, color: 'purple' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-md border border-gray-200 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500 font-medium uppercase">{stat.label}</p>
                            <p className="text-lg font-semibold text-gray-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-md border border-gray-200">
                <div className="relative w-full md:w-96">
                    <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#4F46E5] focus:bg-white transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-md text-[13px] font-medium hover:bg-gray-50 transition-all text-gray-600 bg-white">
                        <LuFilter size={16} />
                        Filter
                    </button>
                    <button onClick={() => refetch()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-md text-[13px] font-medium hover:bg-gray-50 transition-all text-gray-600 bg-white">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-20 text-center text-gray-500">
                        <div className="animate-spin w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p>Loading products...</p>
                    </div>
                ) : products.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {products.map((product: any) => (
                                    <tr key={product._id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                    {product.thumbnail ? (
                                                        <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <LuShoppingBag size={18} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <p className="font-medium text-gray-800 text-[13px] truncate">{product.name}</p>
                                                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">SKU: {product.sku || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[13px] text-gray-600 font-medium">{product.category?.name || 'Uncategorized'}</p>
                                            {product.subCategory && (
                                                <p className="text-[11px] text-gray-400 mt-0.5">{product.subCategory?.name}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[13px] text-gray-800">{formatCurrency(product.price)}</p>
                                            {product.originalPrice > product.price && (
                                                <p className="text-[11px] text-red-500 line-through">{formatCurrency(product.originalPrice)}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <p className={`text-[13px] font-medium ${product.stock <= product.lowStockThreshold ? 'text-red-500' : 'text-gray-700'}`}>
                                                    {product.stock} units
                                                </p>
                                                <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${product.stock === 0 ? 'bg-red-500' :
                                                            product.stock <= product.lowStockThreshold ? 'bg-[var(--color-primary-lightest)]0' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${product.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                product.status === 'draft' ? 'bg-gray-50 text-gray-600 border border-gray-200' :
                                                    'bg-red-50 text-red-700 border border-red-200'
                                                }`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={`/dashboard/admin/products/new?id=${product._id}`}
                                                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-[#4F46E5] transition-all border border-transparent hover:border-gray-100"
                                                    title="Edit"
                                                >
                                                    <LuSquarePen size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-red-500 transition-all border border-transparent hover:border-gray-100"
                                                    title="Delete"
                                                >
                                                    <LuTrash2 size={16} />
                                                </button>
                                                <button className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-500 transition-all border border-transparent hover:border-gray-100">
                                                    <LuEllipsisVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-[var(--color-primary-lightest)] rounded-[20px] flex items-center justify-center mx-auto mb-4 ring-1 ring-[var(--color-primary-border)]">
                            <LuShoppingBag size={28} className="text-[var(--color-primary)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">No products found</h3>
                        <p className="text-gray-500 text-[13px] mt-1 max-w-xs mx-auto">Start adding products to your store to see them listed here.</p>
                        <Link
                            href="/dashboard/admin/products/new"
                            className="inline-flex items-center gap-2 mt-6 px-5 py-2 bg-[#4F46E5] text-white rounded-md font-medium text-sm hover:bg-[#4338CA] transition-all"
                        >
                            <LuPlus size={18} />
                            Add Your First Product
                        </Link>
                    </div>
                )}

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[13px] text-gray-500">
                            Showing <span className="font-semibold text-gray-800">{(page - 1) * 10 + 1}</span> to <span className="font-semibold text-gray-800">{Math.min(page * 10, meta.total)}</span> of <span className="font-semibold text-gray-800">{meta.total}</span> products
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page === meta.totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;
