'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table';

interface Community { id: string; name: string }
interface Unit { id: string; unit_code: string; floor: string | null; building: string | null }

interface Props {
  communities: Community[];
  unitsByCommunity: Record<string, Unit[]>;
  defaultCommunityId: string;
}

export default function UnitsClient({ communities, unitsByCommunity, defaultCommunityId }: Props) {
  const [selectedId, setSelectedId] = useState(defaultCommunityId);
  const [localUnits, setLocalUnits] = useState<Record<string, Unit[]>>(unitsByCommunity);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ unit_code: '', floor: '', building: '' });
  const [saving, setSaving] = useState(false);

  const units = localUnits[selectedId] ?? [];

  function switchCommunity(id: string) {
    setSelectedId(id);
    setShowForm(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: Unit = { id: tempId, unit_code: form.unit_code, floor: form.floor || null, building: form.building || null };
    setLocalUnits(prev => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), optimistic] }));
    setShowForm(false);
    setForm({ unit_code: '', floor: '', building: '' });
    try {
      const created = await api.post<Unit>('/admin/units', { ...form, community_id: selectedId });
      setLocalUnits(prev => ({
        ...prev,
        [selectedId]: (prev[selectedId] ?? []).map(u => u.id === tempId ? created : u),
      }));
      toast.success('Unit added');
    } catch (err: unknown) {
      setLocalUnits(prev => ({ ...prev, [selectedId]: (prev[selectedId] ?? []).filter(u => u.id !== tempId) }));
      setShowForm(true);
      setForm({ unit_code: optimistic.unit_code, floor: optimistic.floor ?? '', building: optimistic.building ?? '' });
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
            value={selectedId}
            onChange={e => switchCommunity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            {units.map(u => (
              <TableRow key={u.id} className={u.id.startsWith('temp-') ? 'opacity-60' : ''}>
                <TableCell className="font-medium">{u.unit_code}</TableCell>
                <TableCell className="text-gray-500">{u.floor || '—'}</TableCell>
                <TableCell className="text-gray-500">{u.building || '—'}</TableCell>
              </TableRow>
            ))}
            {units.length === 0 && <TableEmpty colSpan={3}>No units yet</TableEmpty>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
