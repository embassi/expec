import DashboardSidebar from '@/components/dashboard-sidebar';
import { serverGet } from '@/lib/server-api';

interface SessionUser {
  phone_number?: string | null;
  email?: string | null;
  full_name?: string | null;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await serverGet<SessionUser>('/me', { revalidate: 60 }).catch(() => null);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar user={user} />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
