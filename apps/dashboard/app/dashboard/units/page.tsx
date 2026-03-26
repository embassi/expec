'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useFetch, mutate } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

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
      toast.success('Unit added');
      mutate(`/admin/communities/${communityId}/units`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add unit');
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
          <Button onClick={() => setShowForm(true)} size="sm">+ Add Unit</Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-medium mb-4">Add Unit</h3>
          <form onSubmit={submit} className="grid grid-cols-3 gap-4">
            {(['unit_code', 'floor', 'building'] as const).map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('_', ' ')}</label>
                <Input
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  required={field === 'unit_code'}
                />
              </div>
            ))}
            <div className="col-span-3 flex gap-2">
              <Button type="submit" disabled={saving} size="sm">{saving ? 'Saving…' : 'Add Unit'}</Button>
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
                <TableHead>Unit Code</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Building</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units?.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.unit_code}</TableCell>
                  <TableCell className="text-gray-500">{u.floor || '—'}</TableCell>
                  <TableCell className="text-gray-500">{u.building || '—'}</TableCell>
                </TableRow>
              ))}
              {!units?.length && <TableEmpty colSpan={3}>No units yet</TableEmpty>}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
