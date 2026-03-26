'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useFetch, mutate } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Community { id: string; name: string; slug: string | null; type: string | null; member_count: number }

export default function CommunitiesPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: communities, isLoading } = useFetch<Community[]>('/admin/communities');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/communities', form);
      setShowForm(false);
      setForm({ name: '', slug: '', type: '' });
      toast.success('Community created');
      mutate('/admin/communities');
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
        <Button onClick={() => setShowForm(true)} size="sm">+ New Community</Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-medium mb-4">New Community</h3>
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional)</label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
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
              <Button type="submit" disabled={saving} size="sm">{saving ? 'Saving…' : 'Create'}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="h-10 bg-gray-50 border-b border-gray-200" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
              {[1, 2, 3].map(j => <Skeleton key={j} className="h-4 flex-1" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Members</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(communities || []).map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-gray-500">{c.type || '—'}</TableCell>
                  <TableCell className="text-gray-500">{c.member_count ?? 0}</TableCell>
                </TableRow>
              ))}
              {(communities || []).length === 0 && <TableEmpty colSpan={3}>No communities yet</TableEmpty>}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
