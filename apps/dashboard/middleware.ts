import { NextRequest, NextResponse } from 'next/server';

/**
 * Guards /dashboard routes — redirects to /login if no valid session cookie.
 * Checks token existence and expiry only; signature verification is enforced
 * at the data layer (PostgREST RLS + Railway JWT guard), not here.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('simsim_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('malformed');

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString(),
    );

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('expired');
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.set('simsim_session', '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
