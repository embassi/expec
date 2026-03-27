import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function OverviewPage() {
  const supabase = await createSupabaseServerClient(30);

  const [{ count: total_communities }, { count: total_members }, { count: pending_memberships }] =
    await Promise.all([
      supabase.from('communities').select('*', { count: 'exact', head: true }),
      supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('approval_status', 'approved'),
      supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    ]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Communities" value={total_communities ?? 0} />
        <StatCard label="Total Members" value={total_members ?? 0} />
        <StatCard label="Pending Approvals" value={pending_memberships ?? 0} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
