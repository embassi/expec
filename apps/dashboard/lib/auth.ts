'use client';

export interface SessionUser {
  id: string;
  phone_number: string;
  full_name: string | null;
  role_type: string;
  status: string;
  memberships?: Array<{
    id: string;
    role_type: string;
    approval_status: string;
    community: { id: string; name: string };
  }>;
}

/**
 * Fetches the current user from the BFF /api/auth/me route.
 * The JWT lives in an HttpOnly cookie — this function never sees the raw token.
 * Returns null if unauthenticated or on any error.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Logs out by calling the BFF logout route, which clears the HttpOnly cookie.
 */
export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => {});
}
