import { createSupabaseServiceClient } from '@/lib/supabase-service';
import ScannersClient from './scanners-client';

interface Community { id: string; name: string }
interface Scanner {
  id: string;
  scanner_name: string;
  scanner_code: string;
  device_key: string;
  is_active: boolean;
  location_label: string | null;
  assigned_user?: { full_name: string | null; phone_number: string } | null;
}

export const revalidate = 60;

export default async function ScannersPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: communities }, { data: allScannersRaw }] = await Promise.all([
    supabase.from('communities').select('id, name').order('created_at', { ascending: false }),
    supabase
      .from('scanners')
      .select('id, scanner_name, scanner_code, device_key, is_active, location_label, community_id, assigned_user:assigned_user_id(full_name, phone_number)')
      .order('created_at', { ascending: false }),
  ]);

  const scannersByCommunity = ((allScannersRaw ?? []) as unknown as (Scanner & { community_id: string })[]).reduce<Record<string, Scanner[]>>(
    (acc, { community_id, ...scanner }) => {
      (acc[community_id] ??= []).push(scanner);
      return acc;
    },
    {},
  );

  return (
    <ScannersClient
      communities={(communities ?? []) as Community[]}
      scannersByCommunity={scannersByCommunity}
      defaultCommunityId={communities?.[0]?.id ?? ''}
    />
  );
}
