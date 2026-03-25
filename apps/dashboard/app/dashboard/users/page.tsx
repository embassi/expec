'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { useFetch, mutate } from '@/lib/hooks';

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
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const session = getSession();
  if (session?.user?.role_type !== 'super_admin') {
    router.replace('/dashboard');
    return null;
  }

  const { data: users, isLoading } = useFetch<User[]>('/admin/users');

  async function handleRoleChange(userId: string, roleType: string) {
    setUpdating(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role_type: roleType });
      mutate('/admin/users');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed');
    } finally {
      setUpdating(null);
    }
  }

  if (isLoading) return (
    <div>
      <div className="mb-6"><div className="h-7 w-24 bg-gray-100 rounded animate-pulse" /></div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200" />
        {[1,2,3,4].map(i => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
            {[1,2,3,4,5].map(j => <div key={j} className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />)}
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Global Role</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Communities</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(users || []).map(user => (
              <>
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{user.phone_number}</td>
                  <td className="px-4 py-3 text-gray-700">{user.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={user.role_type} disabled={updating === user.id}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 disabled:opacity-50">
                      {GLOBAL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {user.memberships.length ? user.memberships.map(m => m.community.name).join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {user.memberships.length > 0 && (
                      <button onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                        className="text-xs text-brand-600 hover:text-brand-800">
                        {expanded === user.id ? 'Hide' : 'Details'}
                      </button>
                    )}
                  </td>
                </tr>
                {expanded === user.id && (
                  <tr key={`${user.id}-expanded`} className="bg-gray-50 border-b border-gray-100">
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
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  m.approval_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {m.approval_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
