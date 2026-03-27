import { serverGet } from '@/lib/server-api';
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
  const communities = await serverGet<Community[]>('/admin/communities').catch(() => [] as Community[]);
  const defaultId = communities[0]?.id ?? '';
  const policy = defaultId
    ? await serverGet<Policy>(`/admin/communities/${defaultId}/policy`).catch(() => null)
    : null;
  return (
    <PoliciesClient
      initialCommunities={communities}
      initialPolicy={policy}
      defaultCommunityId={defaultId}
    />
  );
}
