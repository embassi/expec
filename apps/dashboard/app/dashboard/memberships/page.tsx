'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useFetch, mutate } from '@/lib/hooks';

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
  const { data: memberships, isLoading } = useFetch<Membership[]>(
    communityId ? `/admin/communities/${communityId}/memberships` : null
  );
  const { data: units } = useFetch<Unit[]>(
    communityId ? `/admin/communities/${communityId}/units` : null
  );

  async function updateStatus(id: string, status: string) {
    const key = `/admin/communities/${communityId}/memberships`;
    setUpdating(id);
    // Optimistically flip the status so the UI responds instantly
    mutate(key, (current: Membership[] | undefined) =>
      current?.map(m => m.id === id ? { ...m, approval_status: status } : m),
      { revalidate: false }
    );
    try {
      await api.patch(`/admin/memberships/${id}`, { approval_status: status });
      mutate(key);
    } catch {
      mutate(key); // rollback by revalidating from server
    } finally {
      setUpdating('');
    }
  }

  async function resendInvite(membershipId: string) {
    setResending(membershipId);
    try {
      await api.post(`/admin/memberships/${membershipId}/resend-invite`, {});
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
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
          <button onClick={() => setShowForm(true)} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Add Member
          </button>
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
              <input type="tel" placeholder="+20..." value={form.phone_number}
                onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
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
              <button type="submit" disabled={saving} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Adding…' : 'Add'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <Skeleton /> : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr><Th>Member</Th><Th>Unit</Th><Th>Relationship</Th><Th>Role</Th><Th>Status</Th><Th>Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(memberships || []).map(m => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.user.full_name || m.user.phone_number}</p>
                    {m.user.full_name && <p className="text-gray-400 text-xs">{m.user.phone_number}</p>}
                    <span className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                      m.user.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {m.user.status === 'active' ? 'Registered' : 'Not Registered'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.unit?.unit_code || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{m.relationship_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{m.role_type}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.approval_status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {m.approval_status === 'pending' && (
                        <>
                          <button disabled={updating === m.id} onClick={() => updateStatus(m.id, 'approved')}
                            className="text-xs bg-brand-50 text-brand-700 hover:bg-brand-100 px-2 py-1 rounded-md font-medium disabled:opacity-50">
                            Approve
                          </button>
                          <button disabled={updating === m.id} onClick={() => updateStatus(m.id, 'rejected')}
                            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-md font-medium disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}
                      {m.user.status === 'invited' && (
                        <button disabled={resending === m.id} onClick={() => resendInvite(m.id)}
                          className="text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 px-2 py-1 rounded-md font-medium disabled:opacity-50">
                          {resending === m.id ? 'Sending…' : 'Resend Invite'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(memberships || []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No memberships</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{children}</th>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: 'bg-green-50 text-green-700',
    pending: 'bg-yellow-50 text-yellow-700',
    rejected: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="h-10 bg-gray-50 border-b border-gray-200" />
      {[1,2,3,4].map(i => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
          <div className="flex-[2] space-y-1"><div className="h-4 bg-gray-100 rounded animate-pulse" /><div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" /></div>
          {[1,2,3,4,5].map(j => <div key={j} className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ))}
    </div>
  );
}
