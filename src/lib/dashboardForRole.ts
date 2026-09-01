import type { UserRole } from '@/redux/slices/authSlice';

// Each role has its own dashboard shell — customers land in the customer
// account panel, partners in their own panel with product/order tools, admin
// in the full backoffice. Kept in one place so login redirect and dashboard
// guards agree.
export function dashboardForRole(role: UserRole | string | undefined | null): string {
    switch (role) {
        case 'admin':    return '/dashboard/admin';
        case 'company':  return '/dashboard/company';
        case 'dealer':   return '/dashboard/dealer';
        case 'retailer': return '/dashboard/retailer';
        case 'user':
        default:         return '/dashboard/user';
    }
}
