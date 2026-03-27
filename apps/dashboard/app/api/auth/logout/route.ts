import { NextResponse } from 'next/server';

/** Clears all session cookies. Safe to call even if already logged out. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
  };
  response.cookies.set('simsim_session', '', cookieOpts);
  response.cookies.set('simsim_refresh', '', cookieOpts);
  return response;
}
