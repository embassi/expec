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

  let data: { access_token: string; user: unknown };
  try {
    data = await backendRes.json();
  } catch (e) {
    console.error('[login-email] failed to parse backend response:', e);
    return NextResponse.json({ message: 'Invalid API response' }, { status: 502 });
  }

  const { access_token, user } = data;
  if (!access_token) {
    console.error('[login-email] missing access_token in response:', data);
    return NextResponse.json({ message: 'No token returned' }, { status: 502 });
  }

  const response = NextResponse.json({ user });

  try {
    response.cookies.set('simsim_session', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  } catch (e) {
    console.error('[login-email] failed to set cookie:', e);
    return NextResponse.json({ message: 'Failed to set session' }, { status: 500 });
  }

  return response;
}
