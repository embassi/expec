import { createSupabaseServerClient } from '@/lib/supabase-server';
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

export default async function ScannersPage() {
  const supabase = await createSupabaseServerClient(60);

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .order('created_at', { ascending: false });

  const defaultId = communities?.[0]?.id ?? '';

  const scanners: Scanner[] = defaultId
    ? await supabase
        .from('scanners')
        .select('id, scanner_name, scanner_code, device_key, is_active, location_label, assigned_user:assigned_user_id(full_name, phone_number)')
        .eq('community_id', defaultId)
        .order('created_at', { ascending: false })
        .then(({ data }) => (data ?? []) as unknown as Scanner[])
    : [];

  return (
    <ScannersClient
      initialCommunities={(communities ?? []) as Community[]}
      initialScanners={scanners}
      defaultCommunityId={defaultId}
    />
  );
}
