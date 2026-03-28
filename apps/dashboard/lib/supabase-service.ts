import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for server-side reads in admin dashboard pages.
 * Bypasses RLS — safe because this file is server-only and the dashboard is admin-only.
 * Using this instead of the user JWT client allows Next.js to cache fetch responses
 * (Authorization headers disable Next.js fetch caching).
 */
export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
