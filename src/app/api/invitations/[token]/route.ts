import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/infrastructure/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const admin = createServiceRoleClient();

  const { data: invite, error } = await admin
    .from('x3_invitations')
    .select('id, full_name, email, role, pharmacy_id, expires_at, accepted_at, revoked_at')
    .eq('token', token)
    .maybeSingle();

  if (error || !invite) {
    return NextResponse.json({ error: 'Convite nao encontrado.' }, { status: 404 });
  }
  if (invite.accepted_at) {
    return NextResponse.json({ error: 'Convite ja foi aceito.' }, { status: 410 });
  }
  if (invite.revoked_at) {
    return NextResponse.json({ error: 'Convite revogado.' }, { status: 410 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Convite expirado.' }, { status: 410 });
  }

  const { data: pharmacy } = await admin
    .from('pharmacies')
    .select('name')
    .eq('id', invite.pharmacy_id)
    .maybeSingle();

  return NextResponse.json({
    fullName: invite.full_name,
    email: invite.email,
    role: invite.role,
    pharmacyName: pharmacy?.name ?? '',
    expiresAt: invite.expires_at,
  });
}
