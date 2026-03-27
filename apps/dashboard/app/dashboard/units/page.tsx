import { serverGet } from '@/lib/server-api';
import UnitsClient from './units-client';

interface Community { id: string; name: string }
interface Unit { id: string; unit_code: string; floor: string | null; building: string | null }

export default async function UnitsPage() {
  const communities = await serverGet<Community[]>('/admin/communities').catch(() => [] as Community[]);
  const defaultId = communities[0]?.id ?? '';
  const units = defaultId
    ? await serverGet<Unit[]>(`/admin/communities/${defaultId}/units`).catch(() => [] as Unit[])
    : [];
  return <UnitsClient initialCommunities={communities} initialUnits={units} defaultCommunityId={defaultId} />;
}
