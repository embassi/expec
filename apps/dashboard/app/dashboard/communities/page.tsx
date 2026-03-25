'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Community {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  member_count: number;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get<Community[]>('/admin/communities')
      .then(setCommunities)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/communities', form);
      setShowForm(false);
      setForm({ name: '', slug: '', type: '' });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Communities</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + New Community
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-medium mb-4">New Community</h3>
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
            <Input label="Slug (optional)" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type (optional)</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— select —</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            {error && <p className="col-span-2 text-red-500 text-sm">{error}</p>}
            <div className="col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Saving…' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-2">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Members</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {communities.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.type || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.member_count ?? 0}</td>
                </tr>
              ))}
              {communities.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No communities yet</td></tr>
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

function Input({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
