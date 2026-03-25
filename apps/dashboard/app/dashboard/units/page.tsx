'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useFetch, mutate } from '@/lib/hooks';

interface Community { id: string; name: string }
interface Unit { id: string; unit_code: string; floor: string | null; building: string | null }

export default function UnitsPage() {
  const { data: communities } = useFetch<Community[]>('/admin/communities');
  const [selected, setSelected] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ unit_code: '', floor: '', building: '' });
  const [saving, setSaving] = useState(false);

  const communityId = selected || communities?.[0]?.id || null;
  const { data: units, isLoading } = useFetch<Unit[]>(
    communityId ? `/admin/communities/${communityId}/units` : null
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/units', { ...form, community_id: communityId });
      setShowForm(false);
      setForm({ unit_code: '', floor: '', building: '' });
      mutate(`/admin/communities/${communityId}/units`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Units</h2>
        <div className="flex gap-3">
          <select
            value={selected || communityId || ''}
            onChange={e => setSelected(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {communities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Add Unit
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-medium mb-4">Add Unit</h3>
          <form onSubmit={submit} className="grid grid-cols-3 gap-4">
            {['unit_code', 'floor', 'building'].map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('_', ' ')}</label>
                <input
                  value={form[field as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  required={field === 'unit_code'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
            <div className="col-span-3 flex gap-2">
              <button type="submit" disabled={saving} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Saving…' : 'Add Unit'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th>Unit Code</Th><Th>Floor</Th><Th>Building</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {units?.map(u => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.unit_code}</td>
                  <td className="px-4 py-3 text-gray-500">{u.floor || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{u.building || '—'}</td>
                </tr>
              ))}
              {!units?.length && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No units yet</td></tr>}
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
