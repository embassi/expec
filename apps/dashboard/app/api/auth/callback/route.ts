import { NextRequest, NextResponse } from 'next/server';

/**
 * Called by the login page after successful Supabase Auth verification.
 * Sets the Supabase access_token as an HttpOnly cookie so server components
 * can forward it as an Authorization header to PostgREST.
 * User row creation is handled by a Supabase DB trigger (handle_new_auth_user).
 */
export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json().catch(() => ({}));
  if (!access_token) {
    return NextResponse.json({ message: 'access_token required' }, { status: 400 });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ ok: true });

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
