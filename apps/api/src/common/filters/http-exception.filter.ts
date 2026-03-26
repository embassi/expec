import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const correlationId: string | undefined = request?.correlationId;

    // Only report unexpected errors (5xx) to Sentry — 4xx are client errors, not ours
    if (status >= 500) {
      this.logger.error(
        `Unhandled exception [correlationId=${correlationId ?? 'n/a'}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );

      Sentry.withScope((scope) => {
        if (correlationId) scope.setTag('correlation_id', correlationId);
        Sentry.captureException(exception);
      });
    }

    response.status(status).send({
      statusCode: status,
      error: message,
      timestamp: new Date().toISOString(),
      correlationId,
    });
  }
}
