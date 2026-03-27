import { serverGet } from '@/lib/server-api';
import ServiceRequestsClient from './service-requests-client';

interface Community { id: string; name: string }
interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user: { full_name: string | null; phone_number: string };
}

export default async function ServiceRequestsPage() {
  const communities = await serverGet<Community[]>('/admin/communities', { revalidate: 60 }).catch(() => [] as Community[]);
  const defaultId = communities[0]?.id ?? '';
  const requests = defaultId
    ? await serverGet<{ data: ServiceRequest[] }>(`/admin/communities/${defaultId}/service-requests`, { revalidate: 15 })
        .then(r => r.data)
        .catch(() => [] as ServiceRequest[])
    : [] as ServiceRequest[];
  return (
    <ServiceRequestsClient
      initialCommunities={communities}
      initialRequests={requests}
      defaultCommunityId={defaultId}
    />
  );
}
