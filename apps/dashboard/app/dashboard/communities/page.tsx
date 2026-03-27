import { createSupabaseServerClient } from '@/lib/supabase-server';
import CommunitiesClient from './communities-client';

interface Community { id: string; name: string; slug: string | null; type: string | null; member_count: number }

export default async function CommunitiesPage() {
  const supabase = await createSupabaseServerClient(60);
  const { data } = await supabase
    .from('communities')
    .select('id, name, slug, type')
    .order('created_at', { ascending: false });

  const communities: Community[] = (data ?? []).map(c => ({ ...c, member_count: 0 }));
  return <CommunitiesClient initialCommunities={communities} />;
}
