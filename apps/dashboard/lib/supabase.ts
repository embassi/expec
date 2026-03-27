import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for use in Client Components ('use client').
 * Safe to call multiple times — createBrowserClient is singleton-aware.
 */
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
