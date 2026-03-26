/**
 * All dashboard API calls are proxied through /api/proxy/[...path].
 * The Next.js proxy route reads the HttpOnly session cookie server-side
 * and injects the Authorization: Bearer header before forwarding to the API.
 * This keeps the JWT entirely off client-side JavaScript.
 */
const PROXY_BASE = '/api/proxy';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    const msg =
      err.message ??
      (typeof err.error === 'string' ? err.error : err.error?.message) ??
      'Request failed';
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  get: <T>(path: string) => request<T>(path),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
