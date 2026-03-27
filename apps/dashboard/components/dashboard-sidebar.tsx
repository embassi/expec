'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { logout as doLogout } from '@/lib/auth';

const NAV = [
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

interface SidebarUser {
  phone_number?: string | null;
  email?: string | null;
  full_name?: string | null;
}

export default function DashboardSidebar({ user }: { user: SidebarUser | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await doLogout();
    router.replace('/login');
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <h1 className="font-bold text-gray-900">Simsim</h1>
        <p className="text-xs text-gray-400 mt-0.5">Dashboard</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => (
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
          <p className="text-xs text-gray-500 truncate">
            {user.phone_number ?? user.email}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
