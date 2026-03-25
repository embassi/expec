'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useFetch, mutate } from '@/lib/hooks';

interface Community { id: string; name: string }
interface Announcement { id: string; title: string; body: string; created_at: string }

export default function AnnouncementsPage() {
  const { data: communities } = useFetch<Community[]>('/admin/communities');
  const [selected, setSelected] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [saving, setSaving] = useState(false);

  const communityId = selected || communities?.[0]?.id || null;
  const { data: items, isLoading } = useFetch<Announcement[]>(
    communityId ? `/admin/communities/${communityId}/announcements` : null
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post<Announcement>('/admin/announcements', { ...form, community_id: communityId });
      setShowForm(false);
      setForm({ title: '', body: '' });
      mutate(`/admin/communities/${communityId}/announcements`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Announcements</h2>
        <div className="flex gap-3">
          <select value={selected || communityId || ''} onChange={e => setSelected(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {communities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + New Announcement
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-medium mb-4">New Announcement</h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Publishing…' : 'Publish'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <div className="space-y-3">
          {items?.map(a => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{a.title}</h3>
                <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
          {!items?.length && <p className="text-center text-gray-400 text-sm py-8">No announcements yet</p>}
        </div>
      )}
    </div>
  );
}
