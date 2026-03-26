import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload warnings when SENTRY_AUTH_TOKEN is not set (local dev)
  silent: !process.env.SENTRY_AUTH_TOKEN,
  // Upload source maps to Sentry only in CI/prod when auth token is present
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
});
