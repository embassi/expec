import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/**
 * BFF proxy — forwards all dashboard mutations to Railway,
 * injecting the Supabase JWT as a Bearer token.
 * Token is injected by middleware via x-access-token header.
 */
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const token = req.headers.get('x-access-token') ?? undefined;

  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = `${API_URL}/${path.join('/')}${searchParams ? `?${searchParams}` : ''}`;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

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

  const responseBody = await backendRes.text();
  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: { 'Content-Type': backendRes.headers.get('content-type') ?? 'application/json' },
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
