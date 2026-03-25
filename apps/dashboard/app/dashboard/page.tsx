'use client';
import { useFetch } from '@/lib/hooks';

interface Overview {
  total_communities: number;
  total_members: number;
  pending_memberships: number;
}

export default function OverviewPage() {
  const { data } = useFetch<Overview>('/admin/overview');

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Communities" value={data?.total_communities ?? 0} />
        <StatCard label="Total Members" value={data?.total_members ?? 0} />
        <StatCard label="Pending Approvals" value={data?.pending_memberships ?? 0} />
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
