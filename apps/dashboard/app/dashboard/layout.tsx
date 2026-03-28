import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import DashboardSidebar from '@/components/dashboard-sidebar';
import { createSupabaseServiceClient } from '@/lib/supabase-service';

interface SessionUser {
  phone_number?: string | null;
  email?: string | null;
  full_name?: string | null;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { session } } = await supabase.auth.getSession();

  let user: SessionUser | null = null;
  if (session?.user) {
    const service = createSupabaseServiceClient();
    const { data } = await service
      .from('users')
      .select('full_name, phone_number, email')
      .eq('auth_user_id', session.user.id)
      .single();
    user = data;
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar user={user} />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
