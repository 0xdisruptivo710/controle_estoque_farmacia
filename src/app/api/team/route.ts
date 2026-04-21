import { NextResponse } from 'next/server';
import { getAuthenticatedProfile } from '@/infrastructure/supabase/auth-helpers';

export async function GET() {
  const ctx = await getAuthenticatedProfile();
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.error === 'Unauthorized' ? 401 : 403 });
  }

  const { data, error } = await ctx.admin
    .from('x3_profiles')
    .select('id, full_name, role, is_active, is_platform_admin, last_seen_at, created_at')
    .eq('pharmacy_id', ctx.profile.pharmacy_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = (data ?? []).map((m) => m.id);
  const { data: authUsers } = userIds.length
    ? await ctx.admin.auth.admin.listUsers({ perPage: 200 })
    : { data: { users: [] as { id: string; email?: string }[] } };

  const emailById = new Map(authUsers?.users.map((u) => [u.id, u.email ?? ''] as const) ?? []);

  const members = (data ?? []).map((m) => ({
    id: m.id,
    fullName: m.full_name,
    email: emailById.get(m.id) ?? '',
    role: m.role,
    isActive: m.is_active,
    isPlatformAdmin: m.is_platform_admin,
    lastSeenAt: m.last_seen_at,
    isSelf: m.id === ctx.user.id,
  }));

  return NextResponse.json({ members });
}
