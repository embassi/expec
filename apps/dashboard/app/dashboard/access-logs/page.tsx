'use client';
import { useState } from 'react';
import { useFetch } from '@/lib/hooks';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Community { id: string; name: string }
interface Log {
  id: string;
  result: string;
  scan_type: string | null;
  scanned_at: string;
  resident_name: string | null;
  resident_phone: string | null;
  scanner: { scanner_name: string } | null;
}

export default function AccessLogsPage() {
  const [selected, setSelected] = useState('');

  const { data: communities } = useFetch<Community[]>('/admin/communities');
  const communityId = selected || communities?.[0]?.id || '';
  const { data, isLoading } = useFetch<{ logs: Log[]; total: number }>(
    communityId ? `/admin/communities/${communityId}/access-logs` : null
  );
  const logs = data?.logs || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Access Logs</h2>
        <select value={selected || communityId} onChange={e => setSelected(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {(communities || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="h-10 bg-gray-50 border-b border-gray-200" />
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
              {[1,2,3,4,5].map(j => <Skeleton key={j} className="flex-1 h-4" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Scanner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-gray-500 whitespace-nowrap">{new Date(l.scanned_at).toLocaleString()}</TableCell>
                  <TableCell>{l.resident_name || l.resident_phone || '—'}</TableCell>
                  <TableCell className="text-gray-500">{l.scanner?.scanner_name || '—'}</TableCell>
                  <TableCell className="text-gray-500">{l.scan_type || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={l.result === 'granted' ? 'success' : 'error'}>{l.result}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && <TableEmpty colSpan={5}>No logs yet</TableEmpty>}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
