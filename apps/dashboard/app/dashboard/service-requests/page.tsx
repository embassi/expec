'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Community { id: string; name: string }
interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user: { full_name: string | null; phone_number: string };
}

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export default function ServiceRequestsPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selected, setSelected] = useState('');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState('');

  useEffect(() => {
    api.get<Community[]>('/admin/communities').then(cs => {
      setCommunities(cs);
      if (cs.length > 0) setSelected(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get<ServiceRequest[]>(`/admin/communities/${selected}/service-requests`).then(setRequests).finally(() => setLoading(false));
  }, [selected]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await api.patch(`/admin/service-requests/${id}/status`, { status });
      setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    } finally {
      setUpdating('');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Service Requests</h2>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{r.user.full_name || r.user.phone_number}</p>
                  <p className="text-sm text-gray-600 mt-2">{r.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={r.status} />
                  <select
                    value={r.status}
                    disabled={updating === r.id}
                    onChange={e => updateStatus(r.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">{new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
          {requests.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No service requests</p>}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-blue-50 text-blue-700',
    in_progress: 'bg-yellow-50 text-yellow-700',
    resolved: 'bg-green-50 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  };
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>{status.replace('_', ' ')}</span>;
}
