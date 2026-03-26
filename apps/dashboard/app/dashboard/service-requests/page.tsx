'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useFetch, mutate } from '@/lib/hooks';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'success' | 'muted'> = {
  open: 'default',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'muted',
};

export default function ServiceRequestsPage() {
  const { data: communities } = useFetch<Community[]>('/admin/communities');
  const [selected, setSelected] = useState('');
  const [updating, setUpdating] = useState('');

  const communityId = selected || communities?.[0]?.id || null;
  const { data: requests, isLoading } = useFetch<ServiceRequest[]>(
    communityId ? `/admin/communities/${communityId}/service-requests` : null
  );

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await api.patch(`/admin/service-requests/${id}/status`, { status });
      toast.success('Status updated');
      mutate(`/admin/communities/${communityId}/service-requests`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating('');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Service Requests</h2>
        <select value={selected || communityId || ''} onChange={e => setSelected(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {communities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {requests?.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{r.user.full_name || r.user.phone_number}</p>
                  <p className="text-sm text-gray-600 mt-2">{r.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={STATUS_VARIANT[r.status] ?? 'muted'}>{r.status.replace('_', ' ')}</Badge>
                  <select
                    value={r.status}
                    disabled={updating === r.id}
                    onChange={e => updateStatus(r.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none disabled:opacity-50"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">{new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
          {!requests?.length && <p className="text-center text-gray-400 text-sm py-8">No service requests</p>}
        </div>
      )}
    </div>
  );
}
