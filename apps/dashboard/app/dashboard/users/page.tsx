import { serverGet } from '@/lib/server-api';
import UsersClient from './users-client';

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

export default async function UsersPage() {
  const users = await serverGet<User[]>('/admin/users', { revalidate: 15 }).catch(() => [] as User[]);
  return <UsersClient initialUsers={users} />;
}
