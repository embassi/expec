import { createSupabaseServiceClient } from '@/lib/supabase-service';
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

export const revalidate = 30;

export default async function UsersPage() {
  const supabase = createSupabaseServiceClient();

  const { data } = await supabase
    .from('users')
    .select(
      'id, phone_number, email, full_name, status, role_type, created_at, memberships(id, role_type, approval_status, community:community_id(id, name), unit:unit_id(unit_code))',
    )
    .order('created_at', { ascending: false });

  return <UsersClient initialUsers={(data ?? []) as unknown as User[]} />;
}
