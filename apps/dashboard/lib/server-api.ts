import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/**
 * Server-side fetch that reads the HttpOnly session cookie and calls
 * the Railway API directly — no browser round-trip, no proxy hop.
 * Used in async server components so data arrives with the HTML.
 */
export async function serverGet<T>(path: string): Promise<T> {
  const token = (await cookies()).get('simsim_session')?.value;
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`[server-api] ${path} → ${res.status}`);
  return res.json();
}
