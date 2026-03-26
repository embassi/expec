import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Attaches a correlation ID to every request.
 * - If the caller provides X-Correlation-Id it is forwarded as-is (useful for client tracing).
 * - Otherwise a UUID v4 is generated server-side.
 * The ID is echoed back in the response header so clients can match logs to requests.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void): void {
    const existing = req.headers[CORRELATION_ID_HEADER];
    const correlationId = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
    req.correlationId = correlationId;
    res.header(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}
