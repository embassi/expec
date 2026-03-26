import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/**
 * BFF proxy — forwards all dashboard API calls to the backend,
 * injecting the JWT from the HttpOnly session cookie as a Bearer token.
 *
 * This keeps the JWT off client-side JavaScript entirely:
 * - Client calls /api/proxy/admin/communities/...
 * - This route reads simsim_session (HttpOnly), adds Authorization header
 * - Forwards to the actual backend
 */
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const token = req.cookies.get('simsim_session')?.value;

  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = `${API_URL}/${path.join('/')}${searchParams ? `?${searchParams}` : ''}`;

  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') ?? 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.text().catch(() => undefined)
      : undefined;

  const backendRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  }).catch(() => null);

  if (!backendRes) {
    return NextResponse.json({ message: 'API unavailable' }, { status: 503 });
  }

  const contentType = backendRes.headers.get('content-type') ?? 'application/json';
  const responseBody = await backendRes.text();

  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: {
      'Content-Type': contentType,
      // Forward cache headers from backend
      ...(backendRes.headers.get('Cache-Control')
        ? { 'Cache-Control': backendRes.headers.get('Cache-Control')! }
        : {}),
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
