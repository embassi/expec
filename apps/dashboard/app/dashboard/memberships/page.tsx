import { serverGet } from '@/lib/server-api';
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
  const communities = await serverGet<Community[]>('/admin/communities').catch(() => [] as Community[]);
  const defaultId = communities[0]?.id ?? '';
  const [memberships, units] = await Promise.all([
    defaultId
      ? serverGet<PaginatedResponse<Membership>>(`/admin/communities/${defaultId}/memberships`).catch(() => ({ data: [], total: 0, limit: 50, offset: 0 }))
      : Promise.resolve({ data: [], total: 0, limit: 50, offset: 0 }),
    defaultId
      ? serverGet<Unit[]>(`/admin/communities/${defaultId}/units`).catch(() => [] as Unit[])
      : Promise.resolve([] as Unit[]),
  ]);
  return (
    <MembershipsClient
      initialCommunities={communities}
      initialMemberships={memberships}
      initialUnits={units}
      defaultCommunityId={defaultId}
    />
  );
}
