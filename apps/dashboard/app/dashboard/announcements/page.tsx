import { createSupabaseServerClient } from '@/lib/supabase-server';
import AnnouncementsClient from './announcements-client';

interface Community { id: string; name: string }
interface Announcement { id: string; title: string; body: string; created_at: string }

export default async function AnnouncementsPage() {
  const supabase = await createSupabaseServerClient(30);

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .order('created_at', { ascending: false });

  const defaultId = communities?.[0]?.id ?? '';

  const announcements: Announcement[] = defaultId
    ? await supabase
        .from('announcements')
        .select('id, title, body, published_at')
        .eq('community_id', defaultId)
        .order('published_at', { ascending: false, nullsFirst: false })
        .then(({ data }) =>
          (data ?? []).map(a => ({ ...a, created_at: a.published_at ?? '' })) as unknown as Announcement[],
        )
    : [];

  return (
    <AnnouncementsClient
      initialCommunities={(communities ?? []) as Community[]}
      initialAnnouncements={announcements}
      defaultCommunityId={defaultId}
    />
  );
}
