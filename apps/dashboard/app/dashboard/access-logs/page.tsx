import { createSupabaseServiceClient } from '@/lib/supabase-service';
import AccessLogsClient from './access-logs-client';

interface Community { id: string; name: string }
interface Log {
  id: string;
  result: string;
  scan_type: string | null;
  scanned_at: string;
  resident_name: string | null;
  resident_phone: string | null;
  community_id: string;
  scanner: { scanner_name: string } | null;
}

export const revalidate = 5;

export default async function AccessLogsPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: communities }, { data: allLogsRaw }] = await Promise.all([
    supabase.from('communities').select('id, name').order('created_at', { ascending: false }),
    supabase
      .from('access_logs')
      .select('id, result, scan_type, scanned_at, resident_name, resident_phone, community_id, scanner:scanner_id(scanner_name)')
      .order('scanned_at', { ascending: false })
      .limit(500),
  ]);

  const logsByCommunity = ((allLogsRaw ?? []) as unknown as Log[]).reduce<Record<string, Log[]>>(
    (acc, { community_id, ...log }) => {
      (acc[community_id] ??= []).push({ ...log, community_id });
      return acc;
    },
    {},
  );

  return (
    <AccessLogsClient
      communities={(communities ?? []) as Community[]}
      logsByCommunity={logsByCommunity}
      defaultCommunityId={communities?.[0]?.id ?? ''}
    />
  );
}
