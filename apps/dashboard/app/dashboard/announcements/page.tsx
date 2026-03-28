import { createSupabaseServiceClient } from '@/lib/supabase-service';
import AnnouncementsClient from './announcements-client';

interface Community { id: string; name: string }
interface Announcement { id: string; title: string; body: string; created_at: string }

export const revalidate = 30;

export default async function AnnouncementsPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: communities }, { data: allRaw }] = await Promise.all([
    supabase.from('communities').select('id, name').order('created_at', { ascending: false }),
    supabase.from('announcements').select('id, title, body, published_at, community_id').order('published_at', { ascending: false, nullsFirst: false }),
  ]);

  const announcementsByCommunity = ((allRaw ?? []) as { id: string; title: string; body: string; published_at: string | null; community_id: string }[]).reduce<Record<string, Announcement[]>>(
    (acc, { community_id, published_at, ...rest }) => {
      (acc[community_id] ??= []).push({ ...rest, created_at: published_at ?? '' });
      return acc;
    },
    {},
  );

  return (
    <AnnouncementsClient
      communities={(communities ?? []) as Community[]}
      announcementsByCommunity={announcementsByCommunity}
      defaultCommunityId={communities?.[0]?.id ?? ''}
    />
  );
}
