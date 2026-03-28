import { createSupabaseServiceClient } from '@/lib/supabase-service';
import UnitsClient from './units-client';

interface Community { id: string; name: string }
interface Unit { id: string; unit_code: string; floor: string | null; building: string | null }

export const revalidate = 60;

export default async function UnitsPage() {
  const supabase = createSupabaseServiceClient();

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .order('created_at', { ascending: false });

  const defaultId = communities?.[0]?.id ?? '';

  const units: Unit[] = defaultId
    ? await supabase
        .from('units')
        .select('id, unit_code, floor, building')
        .eq('community_id', defaultId)
        .order('unit_code')
        .then(({ data }) => data ?? [])
    : [];

  return (
    <UnitsClient
      initialCommunities={(communities ?? []) as Community[]}
      initialUnits={units}
      defaultCommunityId={defaultId}
    />
  );
}
