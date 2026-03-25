'use client';
import { useState } from 'react';
import { useFetch } from '@/lib/hooks';

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
              {[1,2,3,4,5].map(j => <div key={j} className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr><Th>Time</Th><Th>Person</Th><Th>Scanner</Th><Th>Type</Th><Th>Result</Th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(l => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(l.scanned_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{l.resident_name || l.resident_phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{l.scanner?.scanner_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{l.scan_type || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      l.result === 'granted' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>{l.result}</span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No logs yet</td></tr>}
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
