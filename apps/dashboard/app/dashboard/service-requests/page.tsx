import { createSupabaseServerClient } from '@/lib/supabase-server';
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
  const supabase = await createSupabaseServerClient(15);

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .order('created_at', { ascending: false });

  const defaultId = communities?.[0]?.id ?? '';

  const requests: ServiceRequest[] = defaultId
    ? await supabase
        .from('service_requests')
        .select('id, subject, description, status, created_at, user:user_id(full_name, phone_number)')
        .eq('community_id', defaultId)
        .order('created_at', { ascending: false })
        .then(({ data }) =>
          (data ?? []).map(r => ({ ...r, title: r.subject ?? '' })) as unknown as ServiceRequest[],
        )
    : [];

  return (
    <ServiceRequestsClient
      initialCommunities={(communities ?? []) as Community[]}
      initialRequests={requests}
      defaultCommunityId={defaultId}
    />
  );
}
