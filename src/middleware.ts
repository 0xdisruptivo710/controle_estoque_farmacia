import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PHARMACY_COOKIE = 'pc_has_pharmacy';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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
    const isInvitePage = pathname.startsWith('/invite');

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

    // Not authenticated → login (except auth pages, API routes, invite accept)
    if (!user && !isAuthPage && !isApiRoute && !isInvitePage) {
      // Clear pharmacy cookie on logout
      const response = redirect('/login');
      response.cookies.delete(PHARMACY_COOKIE);
      return response;
    }

    // Authenticated on auth page → dashboard
    if (user && isAuthPage) {
      return redirect('/');
    }

    // Authenticated, not on setup/auth/api/invite → verify profile exists
    if (user && !isAuthPage && !isSetupPage && !isApiRoute && !isInvitePage) {
      // Fast path: cookie set after successful setup — skip DB query
      const hasPharmacyCookie = request.cookies.get(PHARMACY_COOKIE);
      if (hasPharmacyCookie) {
        return supabaseResponse;
      }

      // Slow path: query DB to check profile
      const { data: profile, error: profileError } = await supabase
        .from('x3_profiles')
        .select('id, pharmacy_id')
        .eq('id', user.id)
        .maybeSingle();

      // If DB query fails, fail open — let the page handle it
      if (profileError) {
        console.error('[middleware] Profile check failed:', profileError.message);
        return supabaseResponse;
      }

      if (!profile || !profile.pharmacy_id) {
        return redirect('/setup');
      }

      // Profile found — cache in cookie to skip this check next time
      supabaseResponse.cookies.set(PHARMACY_COOKIE, '1', {
        path: '/',
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax',
        httpOnly: true,
      });
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
