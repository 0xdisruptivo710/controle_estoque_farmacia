import { createServerClient, createServiceRoleClient } from './server';

/**
 * Get the authenticated user's profile using the service role client.
 * Bypasses RLS to avoid "Profile not found" errors when RLS policies
 * block the anon-key profile lookup.
 */
export async function getAuthenticatedProfile() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, profile: null, supabase, admin: createServiceRoleClient(), error: 'Unauthorized' as const };
  }

  // Use service role for ALL database operations to bypass RLS issues
  const admin = createServiceRoleClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, pharmacy_id, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[auth-helpers] Profile query error:', profileError.message);
    return { user, profile: null, supabase, admin, error: 'Profile not found' as const };
  }

  if (!profile || !profile.pharmacy_id) {
    console.error('[auth-helpers] Profile missing for user:', user.id, '| profile:', profile);
    return { user, profile: null, supabase, admin, error: 'Profile not found' as const };
  }

  return { user, profile, supabase, admin, error: null };
}
