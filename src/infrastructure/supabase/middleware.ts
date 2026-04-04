import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function updateSession(request: NextRequest) {
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

  // Not authenticated → redirect to login (except auth pages and API routes)
  if (!user && !isAuthPage && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated on auth page → check if has profile
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Authenticated on non-auth, non-setup, non-api page → check profile exists
  if (user && !isAuthPage && !isSetupPage && !isApiRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, pharmacy_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.pharmacy_id) {
      const url = request.nextUrl.clone();
      url.pathname = '/setup';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
