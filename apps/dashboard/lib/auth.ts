'use client';

export function saveSession(token: string, user: unknown) {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getSession() {
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
