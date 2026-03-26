import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService, QUEUE_JOBS } from '../queue/queue.service';

@Injectable()
export class AccessLogsService implements OnModuleInit {
  private readonly logger = new Logger(AccessLogsService.name);

  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
  ) {}

  async onModuleInit() {
    // Schedule daily archival job: pg-boss cron expression (runs at 02:00 UTC)
    // This moves logs older than 90 days to access_logs_archive via the
    // archive_old_access_logs() Postgres function defined in the 20260326000001
    // migration. No-op when queue is unavailable (dev without DATABASE_URL).
    const boss = this.queue.getBoss();
    if (!boss) return;

    try {
      await boss.schedule(
        QUEUE_JOBS.ARCHIVE_ACCESS_LOGS,
        '0 2 * * *', // daily at 02:00 UTC
        {},
        { tz: 'UTC' },
      );
      await boss.work(QUEUE_JOBS.ARCHIVE_ACCESS_LOGS, async () => {
        await this.archiveOldLogs();
      });
      this.logger.log('Access log archival job scheduled (daily 02:00 UTC)');
    } catch (err: any) {
      // Non-fatal: schedule may already exist from a previous deploy
      this.logger.debug(`Archival job schedule: ${err.message}`);
    }
  }

  async getLogsForCommunity(
    communityId: string,
    limit = 50,
    offset = 0,
  ) {
    const [logs, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where: { community_id: communityId },
        orderBy: { scanned_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.accessLog.count({ where: { community_id: communityId } }),
    ]);

    return { logs, total, limit, offset };
  }

  /** Calls the Postgres archival function — moves logs older than 90 days to cold storage */
  async archiveOldLogs(): Promise<{ archived: number }> {
    const result = await this.prisma.$queryRaw<[{ archived_count: bigint }]>`
      SELECT * FROM archive_old_access_logs()
    `;
    const archived = Number(result[0]?.archived_count ?? 0);
    this.logger.log(`Archived ${archived} access log rows`);
    return { archived };
  }
}
