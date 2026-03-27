import { createSupabaseServerClient } from '@/lib/supabase-server';
import PoliciesClient from './policies-client';

interface Community { id: string; name: string }
interface Policy {
  family_can_generate_guest_passes: boolean;
  tenant_can_generate_guest_passes: boolean;
  staff_can_generate_guest_passes: boolean;
  max_active_guest_passes_per_host: number;
  max_guest_passes_per_day: number;
  guest_pass_guest_duration_hours: number;
  guest_pass_delivery_duration_hours: number;
  guest_pass_service_duration_hours: number;
  guest_pass_guest_usage_limit: number;
  guest_pass_delivery_usage_limit: number;
  guest_pass_service_usage_limit: number;
}

export default async function PoliciesPage() {
  const supabase = await createSupabaseServerClient(60);

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .order('created_at', { ascending: false });

  const defaultId = communities?.[0]?.id ?? '';

  const policy: Policy | null = defaultId
    ? await supabase
        .from('community_policies')
        .select(
          'family_can_generate_guest_passes, tenant_can_generate_guest_passes, staff_can_generate_guest_passes, max_active_guest_passes_per_host, max_guest_passes_per_day, guest_pass_guest_duration_hours, guest_pass_delivery_duration_hours, guest_pass_service_duration_hours, guest_pass_guest_usage_limit, guest_pass_delivery_usage_limit, guest_pass_service_usage_limit',
        )
        .eq('community_id', defaultId)
        .single()
        .then(({ data }) => data as Policy | null)
    : null;

  return (
    <PoliciesClient
      initialCommunities={(communities ?? []) as Community[]}
      initialPolicy={policy}
      defaultCommunityId={defaultId}
    />
  );
}
