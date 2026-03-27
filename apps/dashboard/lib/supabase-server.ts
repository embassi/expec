import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for Server Components and Route Handlers.
 * Reuses the simsim_session HttpOnly cookie (Supabase access_token) as the
 * Authorization header so PostgREST enforces RLS policies correctly —
 * no separate Supabase session cookie needed.
 *
 * @param revalidate - Next.js ISR revalidation in seconds (undefined = no cache override)
 */
export async function createSupabaseServerClient(revalidate?: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('simsim_session')?.value;

  const customFetch =
    revalidate !== undefined
      ? (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, next: { revalidate } } as RequestInit & { next?: { revalidate?: number } })
      : undefined;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        ...(customFetch ? { fetch: customFetch } : {}),
      },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // server components are read-only
      },
    },
  );
}
