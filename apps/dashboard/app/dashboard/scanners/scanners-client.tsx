'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useFetch, mutate } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Community { id: string; name: string }
interface Scanner {
  id: string;
  scanner_name: string;
  scanner_code: string;
  device_key: string;
  is_active: boolean;
  location_label: string | null;
  assigned_user?: { full_name: string | null; phone_number: string } | null;
}

interface Props {
  initialCommunities: Community[];
  initialScanners: Scanner[];
  defaultCommunityId: string;
}

export default function ScannersClient({ initialCommunities, initialScanners, defaultCommunityId }: Props) {
  const [selected, setSelected] = useState(defaultCommunityId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ scanner_name: '', scanner_code: '', location_label: '' });
  const [saving, setSaving] = useState(false);
  const [newScanner, setNewScanner] = useState<Scanner | null>(null);
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});
  const [assignPhone, setAssignPhone] = useState<Record<string, string>>({});

  const { data: communities } = useFetch<Community[]>('/admin/communities', { fallbackData: initialCommunities });
  const communityId = selected || communities?.[0]?.id || '';
  const scannersKey = communityId ? `/admin/communities/${communityId}/scanners` : null;
  const { data: scanners, error: scannersError, isLoading } = useFetch<Scanner[]>(scannersKey, {
    fallbackData: communityId === defaultCommunityId ? initialScanners : undefined,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.post<Scanner>('/admin/scanners', { ...form, community_id: communityId });
      setNewScanner(created);
      setShowForm(false);
      setForm({ scanner_name: '', scanner_code: '', location_label: '' });
      toast.success('Scanner created — save the credentials below');
      mutate(`/admin/communities/${communityId}/scanners`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create scanner');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string) {
    const key = `/admin/communities/${communityId}/scanners`;
    mutate(key, (current: Scanner[] | undefined) =>
      current?.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s),
      { revalidate: false }
    );
    try {
      await api.patch(`/admin/scanners/${id}/toggle`, {});
      mutate(key);
    } catch {
      mutate(key);
      toast.error('Failed to toggle scanner');
    }
  }

  async function assignScanner(id: string) {
    const phone = (assignPhone[id] || '').trim();
    if (!phone) return;
    setAssigning(a => ({ ...a, [id]: true }));
    try {
      await api.patch(`/admin/scanners/${id}/assign`, { phone_number: phone });
      setAssignPhone(p => ({ ...p, [id]: '' }));
      toast.success('Scanner assigned');
      mutate(`/admin/communities/${communityId}/scanners`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign scanner');
    } finally {
      setAssigning(a => ({ ...a, [id]: false }));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Scanners</h2>
        <div className="flex gap-3">
          <select value={selected || communityId} onChange={e => setSelected(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {(communities || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button onClick={() => setShowForm(true)} size="sm">+ Add Scanner</Button>
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
                <Input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required={required} />
              </div>
            ))}
            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={saving} size="sm">{saving ? 'Creating…' : 'Create Scanner'}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {scannersError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          Failed to load scanners: {scannersError.message}. The database may need a migration.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Assigned User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(scanners || []).map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.scanner_name}</TableCell>
                  <TableCell className="text-gray-500">{s.location_label || '—'}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">{s.scanner_code}</TableCell>
                  <TableCell>
                    {s.assigned_user ? (
                      <div className="mb-2">
                        <p className="font-medium text-gray-800">{s.assigned_user.full_name || s.assigned_user.phone_number}</p>
                        {s.assigned_user.full_name && <p className="text-xs text-gray-400">{s.assigned_user.phone_number}</p>}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs mb-2">Unassigned</p>
                    )}
                    <div className="flex gap-1">
                      <Input
                        value={assignPhone[s.id] || ''}
                        onChange={e => setAssignPhone(p => ({ ...p, [s.id]: e.target.value }))}
                        placeholder="+201234567890"
                        className="h-7 text-xs w-36"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => assignScanner(s.id)}
                        disabled={assigning[s.id] || !(assignPhone[s.id] || '').trim()}
                        className="h-7 px-2 text-xs text-brand-700 hover:bg-brand-50"
                      >
                        {assigning[s.id] ? '…' : 'Assign'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'success' : 'muted'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggle(s.id)} className="text-xs text-brand-600 hover:underline">
                      {s.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (scanners || []).length === 0 && !scannersError && (
                <TableEmpty colSpan={6}>No scanners yet</TableEmpty>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
