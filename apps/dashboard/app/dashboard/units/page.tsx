import { createSupabaseServiceClient } from '@/lib/supabase-service';
import UnitsClient from './units-client';

interface Community { id: string; name: string }
interface Unit { id: string; unit_code: string; floor: string | null; building: string | null }

export const revalidate = 60;

export default async function UnitsPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: communities }, { data: allUnitsRaw }] = await Promise.all([
    supabase.from('communities').select('id, name').order('created_at', { ascending: false }),
    supabase.from('units').select('id, unit_code, floor, building, community_id').order('unit_code'),
  ]);

  const unitsByCommunity = ((allUnitsRaw ?? []) as (Unit & { community_id: string })[]).reduce<Record<string, Unit[]>>(
    (acc, { community_id, ...unit }) => {
      (acc[community_id] ??= []).push(unit);
      return acc;
    },
    {},
  );

  return (
    <UnitsClient
      communities={(communities ?? []) as Community[]}
      unitsByCommunity={unitsByCommunity}
      defaultCommunityId={communities?.[0]?.id ?? ''}
    />
  );
}
