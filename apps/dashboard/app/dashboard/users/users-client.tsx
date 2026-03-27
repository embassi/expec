'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useFetch, mutate } from '@/lib/hooks';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Membership {
  id: string;
  role_type: string | null;
  approval_status: string;
  community: { id: string; name: string };
  unit: { unit_code: string } | null;
}

interface User {
  id: string;
  phone_number: string | null;
  email: string | null;
  full_name: string | null;
  status: string;
  role_type: string;
  created_at: string;
  memberships: Membership[];
}

interface Login {
  id: string;
  created_at: string;
  phone_number: string | null;
}

interface Scan {
  id: string;
  scanned_at: string;
  result: string;
  scanner_code: string | null;
  unit_code: string | null;
  denial_reason: string | null;
  community: { name: string } | null;
}

interface UserActivity {
  logins: Login[];
  scans: Scan[];
}

const GLOBAL_ROLES = ['user', 'super_admin'];

function ActivityModal({ userId, userName, onClose }: { userId: string; userName: string; onClose: () => void }) {
  const { data, isLoading } = useFetch<UserActivity>(`/admin/users/${userId}/activity`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Activity Log</h3>
            <p className="text-sm text-gray-500">{userName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (
            <>
              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Login History <span className="font-normal text-gray-400">({data?.logins.length ?? 0})</span>
                </h4>
                {data?.logins.length ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Date & Time</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Via</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.logins.map((l, i) => (
                          <tr key={l.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-gray-700">{new Date(l.created_at).toLocaleString()}</td>
                            <td className="px-4 py-2 text-gray-500 font-mono text-xs">{l.phone_number ?? 'email'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No login history</p>
                )}
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Scan History <span className="font-normal text-gray-400">({data?.scans.length ?? 0})</span>
                </h4>
                {data?.scans.length ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Date & Time</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Community</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Unit</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Result</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.scans.map((s, i) => (
                          <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{new Date(s.scanned_at).toLocaleString()}</td>
                            <td className="px-4 py-2 text-gray-500 text-xs">{s.community?.name ?? '—'}</td>
                            <td className="px-4 py-2 text-gray-500 font-mono text-xs">{s.unit_code ?? '—'}</td>
                            <td className="px-4 py-2">
                              <Badge variant={s.result === 'granted' ? 'success' : 'error'}>{s.result}</Badge>
                            </td>
                            <td className="px-4 py-2 text-gray-400 text-xs">{s.denial_reason ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No scan history</p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activityUserId, setActivityUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const usersUrl = debouncedSearch
    ? `/admin/users?q=${encodeURIComponent(debouncedSearch)}`
    : '/admin/users';

  const { data: users, isLoading } = useFetch<User[]>(usersUrl, {
    fallbackData: debouncedSearch ? undefined : initialUsers,
  });

  const activityUser = activityUserId ? (users ?? []).find(u => u.id === activityUserId) : null;

  async function handleRoleChange(userId: string, roleType: string) {
    setUpdating(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role_type: roleType });
      toast.success('Role updated');
      mutate(usersUrl);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? '…' : `${(users || []).length} users${debouncedSearch ? ' found' : ' on the platform'}`}
          </p>
        </div>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div>
            <div className="h-10 bg-gray-50 border-b border-gray-200" />
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
                {[1,2,3,4,5].map(j => <Skeleton key={j} className="flex-1 h-4" />)}
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone / Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Global Role</TableHead>
                <TableHead>Communities</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    {debouncedSearch ? `No users matching "${debouncedSearch}"` : 'No users yet'}
                  </TableCell>
                </TableRow>
              ) : (
                (users || []).map(user => (
                  <>
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs text-gray-700">
                        {user.phone_number ?? user.email ?? '—'}
                      </TableCell>
                      <TableCell className="text-gray-700">{user.full_name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'success' : 'warning'}>{user.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <select value={user.role_type} disabled={updating === user.id}
                          onChange={e => handleRoleChange(user.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 disabled:opacity-50">
                          {GLOBAL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">
                        {user.memberships.length ? user.memberships.map(m => m.community.name).join(', ') : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActivityUserId(user.id)}
                            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-0.5"
                          >
                            Activity
                          </button>
                          {user.memberships.length > 0 && (
                            <button onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                              className="text-xs text-brand-600 hover:text-brand-800">
                              {expanded === user.id ? 'Hide' : 'Details'}
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded === user.id && (
                      <TableRow key={`${user.id}-expanded`} className="bg-gray-50 border-b border-gray-100">
                        <td colSpan={6} className="px-6 pb-3 pt-0">
                          <table className="w-full text-xs mt-1">
                            <thead>
                              <tr className="text-gray-400">
                                <th className="text-left py-1 pr-4">Community</th>
                                <th className="text-left py-1 pr-4">Unit</th>
                                <th className="text-left py-1 pr-4">Role</th>
                                <th className="text-left py-1">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {user.memberships.map(m => (
                                <tr key={m.id} className="text-gray-600">
                                  <td className="py-1 pr-4">{m.community.name}</td>
                                  <td className="py-1 pr-4">{m.unit?.unit_code ?? '—'}</td>
                                  <td className="py-1 pr-4">{m.role_type ?? '—'}</td>
                                  <td className="py-1">
                                    <Badge variant={m.approval_status === 'approved' ? 'success' : 'muted'}>
                                      {m.approval_status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {activityUserId && (
        <ActivityModal
          userId={activityUserId}
          userName={activityUser?.full_name ?? activityUser?.phone_number ?? activityUser?.email ?? 'User'}
          onClose={() => setActivityUserId(null)}
        />
      )}
    </div>
  );
}
