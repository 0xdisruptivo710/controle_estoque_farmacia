import { NextRequest, NextResponse } from 'next/server';
import { requirePharmacyAdmin } from '@/infrastructure/supabase/auth-helpers';

const ALLOWED_ROLES = new Set(['admin', 'pharmacist', 'attendant']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const ctx = await requirePharmacyAdmin();
  if (ctx.error) {
    const status = ctx.error === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ error: ctx.error }, { status });
  }

  const { userId } = await params;
  const body = await request.json().catch(() => ({}));

  if (userId === ctx.user.id && body.isActive === false) {
    return NextResponse.json({ error: 'Voce nao pode se desativar.' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.isActive === 'boolean') update.is_active = body.isActive;
  if (typeof body.role === 'string') {
    if (!ALLOWED_ROLES.has(body.role)) {
      return NextResponse.json({ error: 'Papel invalido.' }, { status: 400 });
    }
    update.role = body.role;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada a atualizar.' }, { status: 400 });
  }

  const { error } = await ctx.admin
    .from('x3_profiles')
    .update(update)
    .eq('id', userId)
    .eq('pharmacy_id', ctx.profile.pharmacy_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
