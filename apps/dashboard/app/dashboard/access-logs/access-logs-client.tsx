'use client';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table';

interface Community { id: string; name: string }
interface Log {
  id: string;
  result: string;
  scan_type: string | null;
  scanned_at: string;
  resident_name: string | null;
  resident_phone: string | null;
  community_id: string;
  scanner: { scanner_name: string } | null;
}

const PAGE_SIZE = 50;

interface Props {
  communities: Community[];
  logsByCommunity: Record<string, Log[]>;
  defaultCommunityId: string;
}

export default function AccessLogsClient({ communities, logsByCommunity, defaultCommunityId }: Props) {
  const [selectedId, setSelectedId] = useState(defaultCommunityId);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const allLogs = logsByCommunity[selectedId] ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allLogs;
    return allLogs.filter(l =>
      (l.resident_name ?? '').toLowerCase().includes(q) ||
      (l.resident_phone ?? '').toLowerCase().includes(q) ||
      (l.scanner?.scanner_name ?? '').toLowerCase().includes(q),
    );
  }, [allLogs, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageLogs = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function switchCommunity(id: string) {
    setSelectedId(id);
    setSearch('');
    setPage(0);
  }

  function handleSearch(q: string) {
    setSearch(q);
    setPage(0);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold">Access Logs</h2>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search name, phone, scanner…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>
          <select
            value={selectedId}
            onChange={e => switchCommunity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Scanner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageLogs.map(l => (
              <TableRow key={l.id}>
                <TableCell className="text-gray-500 whitespace-nowrap text-xs">{new Date(l.scanned_at).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{l.resident_name || '—'}</TableCell>
                <TableCell className="text-gray-500 font-mono text-xs">{l.resident_phone || '—'}</TableCell>
                <TableCell className="text-gray-500">{l.scanner?.scanner_name || '—'}</TableCell>
                <TableCell className="text-gray-500">{l.scan_type || '—'}</TableCell>
                <TableCell>
                  <Badge variant={l.result === 'granted' ? 'success' : 'error'}>{l.result}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {pageLogs.length === 0 && <TableEmpty colSpan={6}>{search ? `No logs matching "${search}"` : 'No logs yet'}</TableEmpty>}
          </TableBody>
        </Table>

        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{filtered.length} {search ? 'matching' : 'total'} logs</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">←</button>
              <span className="px-2 py-1">{page + 1} / {pageCount}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pageCount - 1}
                className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
