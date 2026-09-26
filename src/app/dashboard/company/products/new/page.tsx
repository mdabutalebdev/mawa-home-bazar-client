'use client';

import { ProductForm } from '@/components/dashboard/ProductForm';

// Company product create & edit (edit via ?id=<productId>). Reuses the same rich
// form the admin uses, wired to the company's own endpoints (variant="company").
export default function CompanyProductFormPage() {
    return <ProductForm variant="company" />;
}
