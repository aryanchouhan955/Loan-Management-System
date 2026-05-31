'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/types';

const roleDefaultRoute: Record<UserRole, string> = {
  admin: '/dashboard/sales',
  sales: '/dashboard/sales',
  sanction: '/dashboard/sanction',
  disbursement: '/dashboard/disbursement',
  collection: '/dashboard/collection',
  borrower: '/apply/personal',
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/login'); return; }
    router.push(roleDefaultRoute[user.role]);
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
