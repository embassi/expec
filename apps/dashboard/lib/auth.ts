'use client';

export interface SessionUser {
  id: string;
  phone_number: string;
  full_name: string | null;
  role_type: string;
  status: string;
}

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  // Also write to cookie so Next.js middleware can read it for auth routing
  document.cookie = `simsim_token=${encodeURIComponent(token)}; path=/; SameSite=Strict; max-age=2592000`;
}

export function getSession(): { token: string; user: SessionUser } | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem('user');
  if (!token || !user) return null;
  return { token, user: JSON.parse(user) };
}

export function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  document.cookie = 'simsim_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

export function isSuperAdmin(): boolean {
  const session = getSession();
  return session?.user?.role_type === 'super_admin';
}
