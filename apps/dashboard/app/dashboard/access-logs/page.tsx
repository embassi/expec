'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selected, setSelected] = useState('');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Community[]>('/admin/communities').then(cs => {
      setCommunities(cs);
      if (cs.length > 0) setSelected(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get<{ logs: Log[]; total: number }>(`/admin/communities/${selected}/access-logs`).then(r => setLogs(r.logs)).finally(() => setLoading(false));
  }, [selected]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Access Logs</h2>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : (
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
