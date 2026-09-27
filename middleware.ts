import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/quoter') ||
    pathname.startsWith('/credits');

  const isAuth = pathname === '/login' || pathname === '/register';

  const response = NextResponse.next();
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
              response.headers.append(
                'Set-Cookie',
                `${name}=${value}; path=${options.path || '/'};${options.httpOnly ? ' HttpOnly' : ''}${options.sameSite ? ` SameSite=${options.sameSite}` : ''}${options.maxAge ? ` Max-Age=${options.maxAge}` : ''}${options.secure ? ' Secure' : ''}`
              );
            }
          } catch {
            // Middleware context cannot set cookies; ignored.
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuth && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/quoter/:path*',
    '/credits/:path*',
    '/login',
    '/register',
  ],
};
