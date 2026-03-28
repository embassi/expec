import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => requestHeaders.set(`cookie`, `${name}=${value}`));
        },
      },
    },
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Inject the access token as a header so the BFF proxy can read it
  // without needing its own Supabase client call.
  if (session?.access_token) {
    requestHeaders.set('x-access-token', session.access_token);
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  // Refresh session cookies if needed
  supabase.auth.getSession(); // triggers cookie refresh via setAll if token was refreshed

  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/proxy/:path*'],
};
