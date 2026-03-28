'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface Community { id: string; name: string }
interface Announcement { id: string; title: string; body: string; created_at: string }

interface Props {
  communities: Community[];
  announcementsByCommunity: Record<string, Announcement[]>;
  defaultCommunityId: string;
}

export default function AnnouncementsClient({ communities, announcementsByCommunity, defaultCommunityId }: Props) {
  const [selectedId, setSelectedId] = useState(defaultCommunityId);
  const [localData, setLocalData] = useState<Record<string, Announcement[]>>(announcementsByCommunity);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [saving, setSaving] = useState(false);

  const items = localData[selectedId] ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: Announcement = { id: tempId, title: form.title, body: form.body, created_at: new Date().toISOString() };
    setLocalData(prev => ({ ...prev, [selectedId]: [optimistic, ...(prev[selectedId] ?? [])] }));
    setShowForm(false);
    setForm({ title: '', body: '' });
    try {
      const created = await api.post<Announcement>('/admin/announcements', { ...form, community_id: selectedId });
      setLocalData(prev => ({
        ...prev,
        [selectedId]: (prev[selectedId] ?? []).map(a => a.id === tempId ? created : a),
      }));
      toast.success('Announcement published');
    } catch (err: unknown) {
      setLocalData(prev => ({ ...prev, [selectedId]: (prev[selectedId] ?? []).filter(a => a.id !== tempId) }));
      setShowForm(true);
      setForm({ title: optimistic.title, body: optimistic.body });
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Announcements</h2>
        <div className="flex gap-3">
          <select
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setShowForm(false); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button onClick={() => setShowForm(true)} size="sm">+ New Announcement</Button>
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
              <Button type="submit" disabled={saving} size="sm">{saving ? 'Publishing…' : 'Publish'}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {items.map(a => (
          <div key={a.id} className={`bg-white border border-gray-200 rounded-xl p-5 ${a.id.startsWith('temp-') ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <h3 className="font-medium">{a.title}</h3>
              <span className="text-xs text-gray-400">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{a.body}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No announcements yet</p>}
      </div>
    </div>
  );
}
