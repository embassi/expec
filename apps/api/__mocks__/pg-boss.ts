// pg-boss v12 is ESM and can't be loaded by Jest's CommonJS runtime.
// QueueService is mocked at the test level anyway, but Jest still needs
// to compile queue.service.ts which imports this package.
export class PgBoss {
  on = jest.fn();
  start = jest.fn().mockResolvedValue(this);
  stop = jest.fn().mockResolvedValue(undefined);
  send = jest.fn().mockResolvedValue('mock-job-id');
  work = jest.fn().mockResolvedValue('mock-worker-id');
}
