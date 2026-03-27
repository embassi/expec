import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Server-side fetch that reads the HttpOnly session cookie and calls
 * the Railway API directly — no browser round-trip, no proxy hop.
 * Used in async server components so data arrives with the HTML.
 *
 * @param revalidate - seconds to cache; 0 = always fresh (access logs, security data)
 */
export async function serverGet<T>(path: string, { revalidate = 30 }: { revalidate?: number } = {}): Promise<T> {
  const token = (await cookies()).get('simsim_session')?.value;
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`[server-api] ${path} → ${res.status}`);
  return res.json();
}
