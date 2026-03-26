import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/**
 * BFF login endpoint.
 * Calls the backend /auth/verify-otp, sets an HttpOnly Secure cookie
 * with the JWT, and returns the user object to the client.
 * The raw JWT never touches client-side JavaScript.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const backendRes = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!backendRes) {
    return NextResponse.json({ message: 'API unavailable' }, { status: 503 });
  }

  if (!backendRes.ok) {
    const err = await backendRes.json().catch(() => ({ message: 'Login failed' }));
    return NextResponse.json(err, { status: backendRes.status });
  }

  const { access_token, user } = await backendRes.json();

  const response = NextResponse.json({ user });

  // HttpOnly: not accessible via document.cookie — immune to XSS token theft
  response.cookies.set('simsim_session', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return response;
}
