import { serverGet } from '@/lib/server-api';
import AnnouncementsClient from './announcements-client';

interface Community { id: string; name: string }
interface Announcement { id: string; title: string; body: string; created_at: string }

export default async function AnnouncementsPage() {
  const communities = await serverGet<Community[]>('/admin/communities').catch(() => [] as Community[]);
  const defaultId = communities[0]?.id ?? '';
  const announcements = defaultId
    ? await serverGet<{ data: Announcement[] }>(`/admin/communities/${defaultId}/announcements`)
        .then(r => r.data)
        .catch(() => [] as Announcement[])
    : [] as Announcement[];
  return (
    <AnnouncementsClient
      initialCommunities={communities}
      initialAnnouncements={announcements}
      defaultCommunityId={defaultId}
    />
  );
}
