import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Called by the login page after successful Supabase Auth verification.
 * Sets the Supabase access_token as an HttpOnly cookie so server components
 * can read it via serverGet(), then calls /auth/sync-user to ensure a row
 * exists in our users table.
 */
export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json().catch(() => ({}));
  if (!access_token) {
    return NextResponse.json({ message: 'access_token required' }, { status: 400 });
  }

  // Ensure user record exists in our DB
  const syncRes = await fetch(`${API_URL}/auth/sync-user`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }).catch(() => null);

  if (!syncRes || !syncRes.ok) {
    const msg = syncRes ? await syncRes.json().catch(() => ({ message: 'Sync failed' })) : { message: 'API unavailable' };
    return NextResponse.json(msg, { status: syncRes?.status ?? 503 });
  }

  const user = await syncRes.json();

  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ user });

  // Primary session cookie — read by serverGet() in server components
  response.cookies.set('simsim_session', access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  // Store refresh token for future token renewal
  if (refresh_token) {
    response.cookies.set('simsim_refresh', refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
  }

  return response;
}
