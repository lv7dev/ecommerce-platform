import type { Metadata } from 'next';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { AdminDashboard } from '@/features/dashboard/components/admin-dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <AuthGuard redirectTo="/login" roles={['ADMIN', 'STAFF']}>
      <AdminDashboard />
    </AuthGuard>
  );
}
