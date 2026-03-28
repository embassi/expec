import { createSupabaseServiceClient } from '@/lib/supabase-service';
import PoliciesClient from './policies-client';

interface Community { id: string; name: string }
export interface Policy {
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

export const revalidate = 60;

export default async function PoliciesPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: communities }, { data: allPolicies }] = await Promise.all([
    supabase.from('communities').select('id, name').order('created_at', { ascending: false }),
    supabase.from('community_policies').select(
      'community_id, family_can_generate_guest_passes, tenant_can_generate_guest_passes, staff_can_generate_guest_passes, max_active_guest_passes_per_host, max_guest_passes_per_day, guest_pass_guest_duration_hours, guest_pass_delivery_duration_hours, guest_pass_service_duration_hours, guest_pass_guest_usage_limit, guest_pass_delivery_usage_limit, guest_pass_service_usage_limit',
    ),
  ]);

  const policiesByCommunity = ((allPolicies ?? []) as (Policy & { community_id: string })[]).reduce<Record<string, Policy>>(
    (acc, { community_id, ...policy }) => { acc[community_id] = policy; return acc; },
    {},
  );

  return (
    <PoliciesClient
      communities={(communities ?? []) as Community[]}
      policiesByCommunity={policiesByCommunity}
      defaultCommunityId={communities?.[0]?.id ?? ''}
    />
  );
}
