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
    return { user: null, profile: null, supabase, error: 'Unauthorized' as const };
  }

  // Use service role to bypass RLS for internal profile lookup
  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, pharmacy_id, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !profile.pharmacy_id) {
    return { user, profile: null, supabase, error: 'Profile not found' as const };
  }

  return { user, profile, supabase, error: null };
}
