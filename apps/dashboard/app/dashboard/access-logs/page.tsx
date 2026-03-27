import { serverGet } from '@/lib/server-api';
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
  const communities = await serverGet<Community[]>('/admin/communities').catch(() => [] as Community[]);
  const defaultId = communities[0]?.id ?? '';
  const logs = defaultId
    ? await serverGet<LogsPage>(`/admin/communities/${defaultId}/access-logs?limit=50&offset=0`).catch(() => EMPTY_PAGE)
    : EMPTY_PAGE;
  return (
    <AccessLogsClient
      initialCommunities={communities}
      initialLogs={logs}
      defaultCommunityId={defaultId}
    />
  );
}
