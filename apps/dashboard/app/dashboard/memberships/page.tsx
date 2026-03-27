import { createSupabaseServerClient } from '@/lib/supabase-server';
import MembershipsClient from './memberships-client';
import type { PaginatedResponse } from '@simsim/types';

interface Community { id: string; name: string }
interface Unit { id: string; unit_code: string }
interface Membership {
  id: string;
  approval_status: string;
  relationship_type: string;
  role_type: string;
  user: { phone_number: string; full_name: string | null; status: string };
  unit: { unit_code: string } | null;
}

export default async function MembershipsPage() {
  const supabase = await createSupabaseServerClient(15);

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .order('created_at', { ascending: false });

  const defaultId = communities?.[0]?.id ?? '';

  const [membershipsResult, units] = await Promise.all([
    defaultId
      ? supabase
          .from('memberships')
          .select(
            'id, approval_status, relationship_type, role_type, user:user_id(phone_number, full_name, status), unit:unit_id(unit_code)',
            { count: 'exact' },
          )
          .eq('community_id', defaultId)
          .order('created_at', { ascending: false })
          .range(0, 49)
      : Promise.resolve({ data: [], count: 0, error: null }),
    defaultId
      ? supabase
          .from('units')
          .select('id, unit_code')
          .eq('community_id', defaultId)
          .order('unit_code')
          .then(({ data }) => (data ?? []) as Unit[])
      : Promise.resolve([] as Unit[]),
  ]);

  const memberships: PaginatedResponse<Membership> = {
    data: (membershipsResult.data ?? []) as unknown as Membership[],
    total: membershipsResult.count ?? 0,
    limit: 50,
    offset: 0,
  };

  return (
    <MembershipsClient
      initialCommunities={(communities ?? []) as Community[]}
      initialMemberships={memberships}
      initialUnits={units}
      defaultCommunityId={defaultId}
    />
  );
}
