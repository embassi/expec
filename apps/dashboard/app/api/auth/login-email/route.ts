import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const backendRes = await fetch(`${API_URL}/auth/verify-email-otp`, {
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

  response.cookies.set('simsim_session', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return response;
}
