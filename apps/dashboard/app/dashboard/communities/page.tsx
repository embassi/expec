import { serverGet } from '@/lib/server-api';
import CommunitiesClient from './communities-client';

interface Community { id: string; name: string; slug: string | null; type: string | null; member_count: number }

export default async function CommunitiesPage() {
  const communities = await serverGet<Community[]>('/admin/communities').catch(() => [] as Community[]);
  return <CommunitiesClient initialCommunities={communities} />;
}
