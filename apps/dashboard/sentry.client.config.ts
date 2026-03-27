import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Guard against double-init (Next.js App Router can execute this during both SSR and CSR)
if (dsn && !Sentry.getClient()) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Replay is browser-only — guard to prevent SSR crash
    ...(typeof window !== 'undefined' ? {
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
      integrations: [Sentry.replayIntegration()],
    } : {}),
  });
}
