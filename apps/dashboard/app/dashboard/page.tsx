'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function OverviewPage() {
  const [communities, setCommunities] = useState<{ id: string; name: string; member_count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ id: string; name: string; member_count: number }[]>('/admin/communities')
      .then(setCommunities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Overview</h2>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Communities" value={communities.length} />
          <StatCard label="Total Members" value={communities.reduce((s, c) => s + (c.member_count ?? 0), 0)} />
        </div>
      )}
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
