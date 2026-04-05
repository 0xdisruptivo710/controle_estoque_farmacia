import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // getUser() refreshes the session — cookies may be updated here
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    const isAuthPage =
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/forgot-password');

    const isSetupPage = pathname.startsWith('/setup');
    const isApiRoute = pathname.startsWith('/api');

    // Redirect helper — copies refreshed session cookies to the redirect response
    function redirect(path: string) {
      const url = request.nextUrl.clone();
      url.pathname = path;
      const response = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value);
      });
      return response;
    }

    // Not authenticated → login (except auth pages and API routes)
    if (!user && !isAuthPage && !isApiRoute) {
      return redirect('/login');
    }

    // Authenticated on auth page → dashboard
    if (user && isAuthPage) {
      return redirect('/');
    }

    // Authenticated, not on setup/auth/api → verify profile exists
    if (user && !isAuthPage && !isSetupPage && !isApiRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, pharmacy_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || !profile.pharmacy_id) {
        return redirect('/setup');
      }
    }

    return supabaseResponse;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
