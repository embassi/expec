import { serverGet } from '@/lib/server-api';
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
  const communities = await serverGet<Community[]>('/admin/communities', { revalidate: 60 }).catch(() => [] as Community[]);
  const defaultId = communities[0]?.id ?? '';
  const scanners = defaultId
    ? await serverGet<Scanner[]>(`/admin/communities/${defaultId}/scanners`, { revalidate: 60 }).catch(() => [] as Scanner[])
    : [] as Scanner[];
  return (
    <ScannersClient
      initialCommunities={communities}
      initialScanners={scanners}
      defaultCommunityId={defaultId}
    />
  );
}
