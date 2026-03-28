import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET ?? process.env.JWT_SECRET);

/**
 * Validates the HttpOnly session cookie on every /dashboard request.
 * Verifies the JWT signature — not just cookie existence.
 * Tampered, expired, or missing tokens redirect to /login.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('simsim_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Token is invalid or expired — clear cookie and redirect
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.set('simsim_session', '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
