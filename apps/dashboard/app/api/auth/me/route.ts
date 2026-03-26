import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Returns the current user from the HttpOnly session cookie.
 * Verifies the JWT signature before making the backend call.
 * Used by client components to hydrate user state after page load.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('simsim_session')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await jwtVerify(token, secret);
  } catch {
    return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
  }

  const backendRes = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);

  if (!backendRes || !backendRes.ok) {
    return NextResponse.json({ message: 'Failed to load user' }, { status: 502 });
  }

  const user = await backendRes.json();
  return NextResponse.json(user);
}
