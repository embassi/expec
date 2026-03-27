import { createSupabaseServerClient } from '@/lib/supabase-server';
import AccessLogsClient from './access-logs-client';

interface Community { id: string; name: string }
interface Log {
  id: string;
  result: string;
  scan_type: string | null;
  scanned_at: string;
  resident_name: string | null;
  resident_phone: string | null;
  scanner: { scanner_name: string } | null;
}
interface LogsPage { data: Log[]; total: number; limit: number; offset: number }

const EMPTY_PAGE: LogsPage = { data: [], total: 0, limit: 50, offset: 0 };

export default async function AccessLogsPage() {
  const supabase = await createSupabaseServerClient(0);

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .order('created_at', { ascending: false });

  const defaultId = communities?.[0]?.id ?? '';

  const logs: LogsPage = defaultId
    ? await supabase
        .from('access_logs')
        .select(
          'id, result, scan_type, scanned_at, resident_name, resident_phone, scanner:scanner_id(scanner_name)',
          { count: 'exact' },
        )
        .eq('community_id', defaultId)
        .order('scanned_at', { ascending: false })
        .range(0, 49)
        .then(({ data, count }) => ({
          data: (data ?? []) as unknown as Log[],
          total: count ?? 0,
          limit: 50,
          offset: 0,
        }))
    : EMPTY_PAGE;

  return (
    <AccessLogsClient
      initialCommunities={(communities ?? []) as Community[]}
      initialLogs={logs}
      defaultCommunityId={defaultId}
    />
  );
}
