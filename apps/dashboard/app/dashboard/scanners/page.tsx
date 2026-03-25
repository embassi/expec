'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Community { id: string; name: string }
interface Scanner { id: string; scanner_name: string; scanner_code: string; device_key: string; is_active: boolean; location_label: string | null }

export default function ScannersPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selected, setSelected] = useState('');
  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ scanner_name: '', scanner_code: '', location_label: '' });
  const [saving, setSaving] = useState(false);
  const [newScanner, setNewScanner] = useState<Scanner | null>(null);

  useEffect(() => {
    api.get<Community[]>('/admin/communities').then(cs => {
      setCommunities(cs);
      if (cs.length > 0) setSelected(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get<Scanner[]>(`/admin/communities/${selected}/scanners`).then(setScanners).finally(() => setLoading(false));
  }, [selected]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.post<Scanner>('/admin/scanners', { ...form, community_id: selected });
      setNewScanner(created);
      setShowForm(false);
      setForm({ scanner_name: '', scanner_code: '', location_label: '' });
      setScanners(ss => [created, ...ss]);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string) {
    await api.patch(`/admin/scanners/${id}/toggle`, {});
    setScanners(ss => ss.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Scanners</h2>
        <div className="flex gap-3">
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Add Scanner
          </button>
        </div>
      </div>

      {newScanner && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 mb-6">
          <p className="font-medium text-brand-800 mb-2">Scanner created — save these credentials now, the device_key won&apos;t be shown again:</p>
          <div className="space-y-1 font-mono text-sm">
            <p><span className="text-gray-500">scanner_code:</span> {newScanner.scanner_code}</p>
            <p><span className="text-gray-500">device_key:</span> {newScanner.device_key}</p>
          </div>
          <button onClick={() => setNewScanner(null)} className="mt-3 text-xs text-brand-600 hover:underline">Dismiss</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-medium mb-4">Add Scanner</h3>
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            {[
              { key: 'scanner_name', label: 'Name', required: true },
              { key: 'scanner_code', label: 'Code (e.g. entrance-1)', required: true },
              { key: 'location_label', label: 'Location label', required: false },
            ].map(({ key, label, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required={required}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            ))}
            <div className="col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Scanner'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr><Th>Name</Th><Th>Location</Th><Th>Code</Th><Th>Status</Th><Th>Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scanners.map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">{s.scanner_name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.location_label || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.scanner_code}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(s.id)} className="text-xs text-brand-600 hover:underline">
                      {s.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
              {scanners.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No scanners yet</td></tr>}
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
