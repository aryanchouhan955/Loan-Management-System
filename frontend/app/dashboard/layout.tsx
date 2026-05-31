'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/types';

interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Sales', path: '/dashboard/sales', roles: ['sales', 'admin'], icon: '👥' },
  { label: 'Sanction', path: '/dashboard/sanction', roles: ['sanction', 'admin'], icon: '✅' },
  { label: 'Disbursement', path: '/dashboard/disbursement', roles: ['disbursement', 'admin'], icon: '💰' },
  { label: 'Collection', path: '/dashboard/collection', roles: ['collection', 'admin'], icon: '📥' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role === 'borrower') { router.push('/apply/personal'); return; }
  }, [user, isLoading, router]);

  const visibleNav = navItems.filter(n => user && n.roles.includes(user.role));

  const roleBadgeColor: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-800',
    sales: 'bg-blue-100 text-blue-800',
    sanction: 'bg-yellow-100 text-yellow-800',
    disbursement: 'bg-green-100 text-green-800',
    collection: 'bg-orange-100 text-orange-800',
    borrower: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">₹</span>
            </div>
            <span className="font-bold text-gray-900">LMS</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {visibleNav.map(item => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith(item.path)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-2">
            <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user?.role ? roleBadgeColor[user.role] : ''}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full text-sm text-gray-500 hover:text-red-500 text-left transition-colors"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
