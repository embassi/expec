import { createSupabaseServiceClient } from '@/lib/supabase-service';
import ServiceRequestsClient from './service-requests-client';

interface Community { id: string; name: string }
interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  community_id: string;
  user: { full_name: string | null; phone_number: string };
}

export const revalidate = 15;

export default async function ServiceRequestsPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: communities }, { data: allRaw }] = await Promise.all([
    supabase.from('communities').select('id, name').order('created_at', { ascending: false }),
    supabase
      .from('service_requests')
      .select('id, subject, description, status, created_at, community_id, user:user_id(full_name, phone_number)')
      .order('created_at', { ascending: false }),
  ]);

  const requestsByCommunity = ((allRaw ?? []) as { id: string; subject: string; description: string; status: string; created_at: string; community_id: string; user: { full_name: string | null; phone_number: string } }[]).reduce<Record<string, ServiceRequest[]>>(
    (acc, { community_id, subject, ...rest }) => {
      (acc[community_id] ??= []).push({ ...rest, title: subject ?? '' });
      return acc;
    },
    {},
  );

  return (
    <ServiceRequestsClient
      communities={(communities ?? []) as Community[]}
      requestsByCommunity={requestsByCommunity}
      defaultCommunityId={communities?.[0]?.id ?? ''}
    />
  );
}
