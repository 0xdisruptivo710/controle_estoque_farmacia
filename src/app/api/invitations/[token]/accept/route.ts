import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/infrastructure/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const password: string = body.password ?? '';
  const fullName: string = (body.fullName ?? '').trim();

  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
  }
  if (!fullName) {
    return NextResponse.json({ error: 'Nome e obrigatorio.' }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  const { data: invite, error: fetchError } = await admin
    .from('pc_invitations')
    .select('id, pharmacy_id, email, role, expires_at, accepted_at, revoked_at')
    .eq('token', token)
    .maybeSingle();

  if (fetchError || !invite) {
    return NextResponse.json({ error: 'Convite nao encontrado.' }, { status: 404 });
  }
  if (invite.accepted_at || invite.revoked_at || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Convite invalido ou expirado.' }, { status: 410 });
  }

  // 1. Create auth.users with email confirmed (admin vouches for identity)
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    const msg = createError?.message ?? 'Erro ao criar usuario.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // 2. Create profile linked to the pharmacy
  const { error: profileError } = await admin
    .from('x3_profiles')
    .insert({
      id: created.user.id,
      pharmacy_id: invite.pharmacy_id,
      full_name: fullName,
      role: invite.role,
      is_active: true,
    });

  if (profileError) {
    // Rollback: delete the orphan auth user
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: 'Erro ao criar perfil.' }, { status: 500 });
  }

  // 3. Mark invitation as accepted
  await admin
    .from('pc_invitations')
    .update({ accepted_at: new Date().toISOString(), accepted_user_id: created.user.id })
    .eq('id', invite.id);

  return NextResponse.json({ ok: true, email: invite.email });
}
