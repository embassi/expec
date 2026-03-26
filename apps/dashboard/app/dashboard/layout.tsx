'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout as doLogout, SessionUser } from '@/lib/auth';

const BASE_NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/users', label: 'Users' },
  { href: '/dashboard/communities', label: 'Communities' },
  { href: '/dashboard/memberships', label: 'Memberships' },
  { href: '/dashboard/units', label: 'Units' },
  { href: '/dashboard/scanners', label: 'Scanners' },
  { href: '/dashboard/access-logs', label: 'Access Logs' },
  { href: '/dashboard/announcements', label: 'Announcements' },
  { href: '/dashboard/service-requests', label: 'Service Requests' },
  { href: '/dashboard/policies', label: 'Policies' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    // Middleware already validated the session; fetch user object for display
    getCurrentUser().then(u => { if (u) setUser(u); });
  }, []);

  async function handleLogout() {
    await doLogout();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <h1 className="font-bold text-gray-900">Simsim</h1>
          <p className="text-xs text-gray-400 mt-0.5">Dashboard</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {BASE_NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-gray-100 space-y-2">
          {user && (
            <p className="text-xs text-gray-500 truncate">{user.phone_number}</p>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
