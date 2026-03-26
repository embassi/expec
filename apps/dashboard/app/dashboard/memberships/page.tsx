'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useFetch, mutate } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { PaginatedResponse } from '@simsim/types';

interface Community { id: string; name: string }
interface Unit { id: string; unit_code: string }
interface Membership {
  id: string;
  approval_status: string;
  relationship_type: string;
  role_type: string;
  user: { phone_number: string; full_name: string | null; status: string };
  unit: { unit_code: string } | null;
}

type FormMode = 'owner' | 'manager';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'muted'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
};

export default function MembershipsPage() {
  const [selected, setSelected] = useState('');
  const [updating, setUpdating] = useState('');
  const [resending, setResending] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('owner');
  const [form, setForm] = useState({ phone_number: '', unit_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: communities } = useFetch<Community[]>('/admin/communities');
  const communityId = selected || communities?.[0]?.id || '';
  const { data: page, isLoading } = useFetch<PaginatedResponse<Membership>>(
    communityId ? `/admin/communities/${communityId}/memberships` : null
  );
  const memberships = page?.data;
  const { data: units } = useFetch<Unit[]>(
    communityId ? `/admin/communities/${communityId}/units` : null
  );

  async function updateStatus(id: string, status: string) {
    const key = `/admin/communities/${communityId}/memberships`;
    setUpdating(id);
    mutate(key, (current: PaginatedResponse<Membership> | undefined) =>
      current ? { ...current, data: current.data.map(m => m.id === id ? { ...m, approval_status: status } : m) } : current,
      { revalidate: false }
    );
    try {
      await api.patch(`/admin/memberships/${id}`, { approval_status: status });
      toast.success(`Membership ${status}`);
      mutate(key);
    } catch {
      mutate(key);
      toast.error('Failed to update membership');
    } finally {
      setUpdating('');
    }
  }

  async function resendInvite(membershipId: string) {
    setResending(membershipId);
    try {
      await api.post(`/admin/memberships/${membershipId}/resend-invite`, {});
      toast.success('Invite sent');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setResending('');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (formMode === 'owner') {
        await api.post(`/admin/communities/${communityId}/assign-owner`, {
          phone_number: form.phone_number,
          unit_id: form.unit_id,
        });
      } else {
        await api.post(`/admin/communities/${communityId}/managers`, {
          phone_number: form.phone_number,
        });
      }
      setShowForm(false);
      setForm({ phone_number: '', unit_id: '' });
      toast.success('Member added');
      mutate(`/admin/communities/${communityId}/memberships`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Memberships</h2>
        <div className="flex gap-3">
          <select value={selected || communityId} onChange={e => setSelected(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {(communities || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button onClick={() => setShowForm(true)} size="sm">+ Add Member</Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex gap-4 mb-4">
            {(['owner', 'manager'] as FormMode[]).map(mode => (
              <button key={mode} type="button" onClick={() => setFormMode(mode)}
                className={`text-sm font-medium px-4 py-1.5 rounded-full ${formMode === mode ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {mode === 'owner' ? 'Unit Owner' : 'Manager'}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
              <Input type="tel" placeholder="+20..." value={form.phone_number}
                onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} required />
            </div>
            {formMode === 'owner' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select value={form.unit_id} onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">— select unit —</option>
                  {(units || []).map(u => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
              </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} size="sm">{saving ? 'Adding…' : 'Add'}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setError(''); }}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="h-10 bg-gray-50 border-b border-gray-200" />
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
              <div className="flex-[2] space-y-1"><Skeleton className="h-4" /><Skeleton className="h-3 w-2/3" /></div>
              {[1,2,3,4,5].map(j => <Skeleton key={j} className="flex-1 h-4" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(memberships || []).map(m => (
                <TableRow key={m.id}>
                  <TableCell>
                    <p className="font-medium">{m.user.full_name || m.user.phone_number}</p>
                    {m.user.full_name && <p className="text-gray-400 text-xs">{m.user.phone_number}</p>}
                    <Badge variant={m.user.status === 'active' ? 'success' : 'warning'} className="mt-1">
                      {m.user.status === 'active' ? 'Registered' : 'Not Registered'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{m.unit?.unit_code || '—'}</TableCell>
                  <TableCell className="text-gray-500">{m.relationship_type || '—'}</TableCell>
                  <TableCell className="text-gray-500">{m.role_type}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[m.approval_status] ?? 'muted'}>{m.approval_status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {m.approval_status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" disabled={updating === m.id}
                            className="text-xs text-brand-700 hover:bg-brand-50 h-7 px-2"
                            onClick={() => updateStatus(m.id, 'approved')}>
                            Approve
                          </Button>
                          <Button variant="ghost" size="sm" disabled={updating === m.id}
                            className="text-xs text-red-600 hover:bg-red-50 h-7 px-2"
                            onClick={() => updateStatus(m.id, 'rejected')}>
                            Reject
                          </Button>
                        </>
                      )}
                      {m.user.status === 'invited' && (
                        <Button variant="ghost" size="sm" disabled={resending === m.id}
                          className="text-xs text-yellow-700 hover:bg-yellow-50 h-7 px-2"
                          onClick={() => resendInvite(m.id)}>
                          {resending === m.id ? 'Sending…' : 'Resend Invite'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(memberships || []).length === 0 && <TableEmpty colSpan={6}>No memberships</TableEmpty>}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
