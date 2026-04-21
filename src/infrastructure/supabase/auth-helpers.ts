import { createServerClient, createServiceRoleClient } from './server';

/**
 * Get the authenticated user's profile using the service role client.
 * Bypasses RLS to avoid "Profile not found" errors when RLS policies
 * block the anon-key profile lookup.
 *
 * Returns `isPlatformAdmin` so callers can short-circuit pharmacy-scoped
 * checks when the user is a super-admin.
 */
export async function getAuthenticatedProfile() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      profile: null,
      isPlatformAdmin: false,
      supabase,
      admin: createServiceRoleClient(),
      error: 'Unauthorized' as const,
    };
  }

  const admin = createServiceRoleClient();
  const { data: profile, error: profileError } = await admin
    .from('x3_profiles')
    .select('id, pharmacy_id, full_name, role, is_platform_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[auth-helpers] Profile query error:', profileError.message);
    return { user, profile: null, isPlatformAdmin: false, supabase, admin, error: 'Profile not found' as const };
  }

  if (!profile || !profile.pharmacy_id) {
    console.error('[auth-helpers] Profile missing for user:', user.id, '| profile:', profile);
    return { user, profile: null, isPlatformAdmin: false, supabase, admin, error: 'Profile not found' as const };
  }

  return {
    user,
    profile,
    isPlatformAdmin: profile.is_platform_admin === true,
    supabase,
    admin,
    error: null,
  };
}

/**
 * Guard for platform-only routes (e.g. /api/platform/*).
 * Returns the profile + admin client, or an error string to respond with.
 */
export async function requirePlatformAdmin() {
  const ctx = await getAuthenticatedProfile();
  if (ctx.error) return ctx;
  if (!ctx.isPlatformAdmin) {
    return { ...ctx, error: 'Forbidden' as const };
  }
  return ctx;
}

/**
 * Guard for pharmacy-admin routes (team management, settings).
 * Platform admins pass through since they also have role='admin' in their own pharmacy.
 */
export async function requirePharmacyAdmin() {
  const ctx = await getAuthenticatedProfile();
  if (ctx.error) return ctx;
  if (ctx.profile?.role !== 'admin' && !ctx.isPlatformAdmin) {
    return { ...ctx, error: 'Forbidden' as const };
  }
  return ctx;
}
