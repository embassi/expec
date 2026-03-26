import { NextResponse } from 'next/server';

/** Clears the session cookie. Safe to call even if already logged out. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('simsim_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}
