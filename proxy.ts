import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const esRutaProtegida =
    pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  const esRutaAuth = pathname === '/login' || pathname === '/register';

  if (!user && esRutaProtegida) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('redirect', pathname);
    return redirigirConCookies(url, response);
  }

  if (user && esRutaAuth) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return redirigirConCookies(url, response);
  }

  return response;
}

function redirigirConCookies(url: URL, response: NextResponse) {
  const redireccion = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redireccion.cookies.set(cookie);
  });
  return redireccion;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
};
