import { getCredentials } from './credentials';

const API_URL = 'https://patient-presence-production-7e3f.up.railway.app';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const creds = await getCredentials();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(creds
        ? {
            'x-scanner-code': creds.scanner_code,
            'x-device-key': creds.device_key,
          }
        : {}),
      ...(options.headers as Record<string, string> | undefined ?? {}),
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
};
