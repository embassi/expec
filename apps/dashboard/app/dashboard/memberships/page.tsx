import { createSupabaseServiceClient } from '@/lib/supabase-service';
import MembershipsClient from './memberships-client';

interface Community { id: string; name: string }
interface Unit { id: string; unit_code: string }
interface Membership {
  id: string;
  approval_status: string;
  relationship_type: string;
  role_type: string;
  community_id: string;
  user: { phone_number: string; full_name: string | null; status: string };
  unit: { unit_code: string } | null;
}

export const revalidate = 15;

export default async function MembershipsPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: communities }, { data: allMembershipsRaw }, { data: allUnitsRaw }] = await Promise.all([
    supabase.from('communities').select('id, name').order('created_at', { ascending: false }),
    supabase
      .from('memberships')
      .select('id, approval_status, relationship_type, role_type, community_id, user:user_id(phone_number, full_name, status), unit:unit_id(unit_code)')
      .order('created_at', { ascending: false }),
    supabase.from('units').select('id, unit_code, community_id').order('unit_code'),
  ]);

  const membershipsByCommunity = ((allMembershipsRaw ?? []) as unknown as Membership[]).reduce<Record<string, Membership[]>>(
    (acc, m) => {
      (acc[m.community_id] ??= []).push(m);
      return acc;
    },
    {},
  );

  const unitsByCommunity = ((allUnitsRaw ?? []) as (Unit & { community_id: string })[]).reduce<Record<string, Unit[]>>(
    (acc, { community_id, ...unit }) => {
      (acc[community_id] ??= []).push(unit);
      return acc;
    },
    {},
  );

  return (
    <MembershipsClient
      communities={(communities ?? []) as Community[]}
      membershipsByCommunity={membershipsByCommunity}
      unitsByCommunity={unitsByCommunity}
      defaultCommunityId={communities?.[0]?.id ?? ''}
    />
  );
}
