import { NextRequest, NextResponse } from 'next/server';
import { requirePharmacyAdmin } from '@/infrastructure/supabase/auth-helpers';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requirePharmacyAdmin();
  if (ctx.error) {
    const status = ctx.error === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ error: ctx.error }, { status });
  }

  const { id } = await params;

  const { error } = await ctx.admin
    .from('x3_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('pharmacy_id', ctx.profile.pharmacy_id)
    .is('accepted_at', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
