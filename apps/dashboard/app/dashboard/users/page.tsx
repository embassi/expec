'use client';
import { useState } from 'react';
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
  phone_number: string;
  full_name: string | null;
  status: string;
  role_type: string;
  created_at: string;
  memberships: Membership[];
}

const GLOBAL_ROLES = ['user', 'super_admin'];

export default function UsersPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // SuperAdminGuard on the API will reject unauthorized access; middleware guards the route
  const { data: users, isLoading } = useFetch<User[]>('/admin/users');

  async function handleRoleChange(userId: string, roleType: string) {
    setUpdating(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role_type: roleType });
      toast.success('Role updated');
      mutate('/admin/users');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  }

  if (isLoading) return (
    <div>
      <div className="mb-6"><Skeleton className="h-7 w-24" /></div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200" />
        {[1,2,3,4].map(i => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
            {[1,2,3,4,5].map(j => <Skeleton key={j} className="flex-1 h-4" />)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Users</h2>
        <p className="text-sm text-gray-500 mt-1">{(users || []).length} users on the platform</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Global Role</TableHead>
              <TableHead>Communities</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users || []).map(user => (
              <>
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs text-gray-700">{user.phone_number}</TableCell>
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
                    {user.memberships.length > 0 && (
                      <button onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                        className="text-xs text-brand-600 hover:text-brand-800">
                        {expanded === user.id ? 'Hide' : 'Details'}
                      </button>
                    )}
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
