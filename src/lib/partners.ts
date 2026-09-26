/**
 * Shared helpers for the admin "Partner approvals" list and the single-partner
 * details page. Dealers / companies / retailers all share the same
 * apply → approve lifecycle, so one normaliser + one set of helpers serves them.
 */

export type Kind = 'dealers' | 'companies' | 'retailers';
export type Status = 'pending' | 'approved' | 'suspended' | 'rejected';

export const STATUSES: { id: Status; label: string }[] = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'suspended', label: 'Suspended' },
    { id: 'rejected', label: 'Rejected' },
];

export const STATUS_PILL: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    suspended: 'bg-orange-50 text-orange-700 border-orange-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
};

export const KIND_LABEL: Record<Kind, string> = {
    dealers: 'Dealer',
    companies: 'Company',
    retailers: 'Retailer',
};

/** Whether this partner type carries a commission rate. */
export const KIND_HAS_COMMISSION: Record<Kind, boolean> = {
    dealers: true,
    companies: true,
    retailers: false,
};

const SHOP_TYPE: Record<string, string> = {
    grocery: 'Grocery shop',
    pharmacy: 'Pharmacy',
    electronics: 'Electronics shop',
    cosmetics: 'Cosmetics shop',
    stationery: 'Stationery shop',
    hardware: 'Hardware shop',
    other: 'Shop',
};

// Uploads come back as absolute URLs, but older rows may hold a bare /uploads
// path — resolve those against the API origin so the thumbnail still loads.
export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
export const imgSrc = (u?: string) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u) || u.startsWith('data:')) return u;
    return `${API_ORIGIN}${u.startsWith('/') ? '' : '/'}${u}`;
};

export const fullName = (u: any) => `${u?.firstName || ''} ${u?.lastName || ''}`.trim();
/** Populated geo docs are objects; unpopulated ones are bare ids we cannot name. */
export const geoName = (g: any) => (g && typeof g === 'object' ? (g.name || g.bnName || '') : '');

export const formatDate = (d?: string) => {
    if (!d) return '—';
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export interface DocRef {
    label: string;
    number?: string;
    image?: string;
}

export interface PartnerRow {
    id: string;
    /** The linked login account's user id — used to edit email / reset password. */
    userId: string;
    title: string;
    subtitle: string;
    holderName: string;
    email: string;
    phone: string;
    upazila: string;
    district: string;
    docs: DocRef[];
    appliedAt: string;
    status: string;
    rejectionReason: string;
    /** null for partner types that carry no commission. */
    commissionRate: number | null;
}

export const normalisePartner = (kind: Kind, d: any): PartnerRow => {
    const base = {
        id: String(d?._id || ''),
        userId: String(d?.user?._id || ''),
        holderName: fullName(d?.user),
        email: d?.user?.email || '',
        appliedAt: d?.createdAt || '',
        status: d?.status || 'pending',
        rejectionReason: d?.rejectionReason || '',
    };

    if (kind === 'dealers') {
        return {
            ...base,
            title: d?.name || 'Unnamed dealer',
            subtitle: d?.address || '',
            phone: d?.phone || d?.user?.phone || '',
            upazila: geoName(d?.upazila),
            district: geoName(d?.district),
            docs: [
                { label: 'NID', number: d?.nid, image: d?.nidImage },
                { label: 'Trade licence', number: d?.tradeLicense, image: d?.tradeLicenseImage },
                { label: 'Shop photo', image: d?.shopImage },
            ],
            commissionRate: Number(d?.commissionRate ?? 0),
        };
    }

    if (kind === 'companies') {
        return {
            ...base,
            title: d?.name || 'Unnamed company',
            subtitle: d?.type === 'service' ? 'Service company' : 'Product company',
            phone: d?.phone || d?.user?.phone || '',
            upazila: geoName(d?.upazila),
            district: geoName(d?.district),
            docs: [
                { label: 'Trade licence', number: d?.tradeLicense, image: d?.tradeLicenseImage },
                { label: 'TIN', number: d?.tin },
                { label: 'BIN', number: d?.bin },
            ],
            commissionRate: Number(d?.commissionRate ?? 0),
        };
    }

    // Retailers — the only remaining partner type besides dealers and companies.
    return {
        ...base,
        title: d?.shopName || 'Unnamed shop',
        subtitle: [SHOP_TYPE[d?.shopType] || 'Shop', d?.ownerName].filter(Boolean).join(' · '),
        phone: d?.phone || d?.user?.phone || '',
        upazila: geoName(d?.upazila),
        district: geoName(d?.district),
        docs: [
            { label: 'NID', number: d?.nid, image: d?.nidImage },
            { label: 'Trade licence', number: d?.tradeLicense, image: d?.tradeLicenseImage },
            { label: 'Shop photo', image: d?.shopImage },
        ],
        commissionRate: null,
    };
};
