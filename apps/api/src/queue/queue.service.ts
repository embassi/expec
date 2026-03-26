import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';
import type { Job, WorkOptions, SendOptions } from 'pg-boss';

export const QUEUE_JOBS = {
  SEND_OTP: 'send-otp',
  SEND_GUEST_PASS: 'send-guest-pass',
  SEND_WELCOME: 'send-welcome',
  ARCHIVE_ACCESS_LOGS: 'archive-access-logs',
} as const;

export type QueueJobName = (typeof QUEUE_JOBS)[keyof typeof QUEUE_JOBS];

// Default retry policy applied to all enqueued jobs
const DEFAULT_SEND_OPTIONS: SendOptions = {
  retryLimit: 3,
  retryDelay: 30,  // 30s initial delay
  retryBackoff: true,  // exponential: 30s → ~2m → ~8m
  expireInSeconds: 600, // job fails if not completed within 10 minutes
};

/**
 * Thin wrapper around pg-boss.
 * Provides a single boss instance shared across the app, started on module init.
 *
 * Why pg-boss:
 * - Uses the existing Postgres database — no extra infrastructure
 * - Survives API restarts (jobs persist in DB)
 * - Built-in retry with exponential backoff
 */
@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private boss!: PgBoss;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const connectionString =
      this.config.get<string>('DATABASE_URL') ??
      this.config.get<string>('DIRECT_URL');

    if (!connectionString) {
      this.logger.warn(
        'DATABASE_URL not set — QueueService running in no-op mode (jobs will be dropped)',
      );
      return;
    }

    this.boss = new PgBoss(connectionString);

    this.boss.on('error', (err: Error) => {
      this.logger.error('pg-boss error', err.message);
    });

    await this.boss.start();
    this.logger.log('Job queue started');
  }

  async onModuleDestroy() {
    if (this.boss) {
      await this.boss.stop();
      this.logger.log('Job queue stopped');
    }
  }

  /**
   * Enqueue a job with the default retry policy.
   * Returns the job ID or null if the queue isn't available.
   */
  async enqueue<T extends object>(
    jobName: QueueJobName,
    data: T,
    options?: SendOptions,
  ): Promise<string | null> {
    if (!this.boss) {
      this.logger.warn(`Queue not available — dropping job: ${jobName}`);
      return null;
    }
    const id = await this.boss.send(jobName, data, { ...DEFAULT_SEND_OPTIONS, ...options });
    this.logger.log(`Enqueued job ${jobName} id=${id}`);
    return id;
  }

  /**
   * Register a worker for a job type.
   * In pg-boss v12, the handler receives a batch (Job<T>[]) not a single job.
   * Workers are registered by feature modules on startup.
   */
  async registerWorker<T extends object>(
    jobName: QueueJobName,
    handler: (jobs: Job<T>[]) => Promise<void>,
    options?: WorkOptions,
  ) {
    if (!this.boss) {
      this.logger.warn(`Queue not available — worker for ${jobName} not registered`);
      return;
    }
    await this.boss.work<T>(jobName, options ?? {}, handler);
    this.logger.log(`Worker registered for ${jobName}`);
  }

  /** Expose boss directly for advanced use (e.g. transactional enqueue) */
  getBoss(): PgBoss | null {
    return this.boss ?? null;
  }
}
