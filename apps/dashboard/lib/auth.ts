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
}

export function isSuperAdmin(): boolean {
  const session = getSession();
  return session?.user?.role_type === 'super_admin';
}
