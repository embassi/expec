'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useFetch, mutate } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Community { id: string; name: string }
interface Announcement { id: string; title: string; body: string; created_at: string }

interface Props {
  initialCommunities: Community[];
  initialAnnouncements: Announcement[];
  defaultCommunityId: string;
}

export default function AnnouncementsClient({ initialCommunities, initialAnnouncements, defaultCommunityId }: Props) {
  const [selected, setSelected] = useState(defaultCommunityId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [saving, setSaving] = useState(false);

  const { data: communities } = useFetch<Community[]>('/admin/communities', { fallbackData: initialCommunities });
  const communityId = selected || communities?.[0]?.id || null;
  const announcementsKey = communityId ? `/admin/communities/${communityId}/announcements` : null;
  const { data: page, isLoading } = useFetch<{ data: Announcement[] }>(announcementsKey, {
    fallbackData: communityId === defaultCommunityId ? { data: initialAnnouncements } : undefined,
  });
  const items = page?.data;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post<Announcement>('/admin/announcements', { ...form, community_id: communityId });
      setShowForm(false);
      setForm({ title: '', body: '' });
      toast.success('Announcement published');
      mutate(`/admin/communities/${communityId}/announcements`);
    } catch (err: unknown) {
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
          <select value={selected || communityId || ''} onChange={e => setSelected(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {communities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
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
