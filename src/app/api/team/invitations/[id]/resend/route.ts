import { NextRequest, NextResponse } from 'next/server';
import { requirePharmacyAdmin } from '@/infrastructure/supabase/auth-helpers';
import { FlwChatWhatsAppService } from '@/infrastructure/services/FlwChatWhatsAppService';

const EXPIRY_DAYS = 7;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requirePharmacyAdmin();
  if (ctx.error) {
    const status = ctx.error === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ error: ctx.error }, { status });
  }

  const { id } = await params;

  const { data: invite, error: fetchError } = await ctx.admin
    .from('x3_invitations')
    .select('id, full_name, email, whatsapp, role, token, expires_at, accepted_at, revoked_at')
    .eq('id', id)
    .eq('pharmacy_id', ctx.profile.pharmacy_id)
    .maybeSingle();

  if (fetchError || !invite) {
    return NextResponse.json({ error: 'Convite nao encontrado.' }, { status: 404 });
  }
  if (invite.accepted_at) {
    return NextResponse.json({ error: 'Convite ja aceito.' }, { status: 409 });
  }
  if (invite.revoked_at) {
    return NextResponse.json({ error: 'Convite revogado.' }, { status: 409 });
  }
  if (!invite.whatsapp) {
    return NextResponse.json({ error: 'Convite sem numero de WhatsApp.' }, { status: 400 });
  }

  // Renew expiry on resend
  const newExpiry = new Date(Date.now() + EXPIRY_DAYS * 86400_000).toISOString();

  const { data: pharmacy } = await ctx.admin
    .from('pharmacies')
    .select('name, settings')
    .eq('id', ctx.profile.pharmacy_id)
    .maybeSingle();

  const settings = (pharmacy?.settings ?? {}) as { flwchat?: { apiUrl?: string; apiToken?: string; fromPhone?: string } };
  const flwConfig = settings.flwchat;
  const apiToken = flwConfig?.apiToken ?? process.env.FLWCHAT_API_TOKEN;

  if (!apiToken) {
    return NextResponse.json({ error: 'FlwChat nao configurado.' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const inviteUrl = `${appUrl}/invite/${invite.token}`;
  const roleLabel = invite.role === 'pharmacist' ? 'Farmaceutica' : 'Atendente';
  const pharmacyName = pharmacy?.name ?? 'sua farmacia';
  const message =
    `Ola, ${invite.full_name}! Reenviando seu convite para o PharmaControl como ${roleLabel} em ${pharmacyName}.\n\n` +
    `Aceite e defina sua senha (valido por ${EXPIRY_DAYS} dias):\n${inviteUrl}`;

  try {
    const service = new FlwChatWhatsAppService({
      apiUrl: flwConfig?.apiUrl,
      apiToken,
      fromPhone: flwConfig?.fromPhone ?? null,
    });
    await service.sendWhatsApp(invite.whatsapp, message);

    await ctx.admin
      .from('x3_invitations')
      .update({ sent_via: 'whatsapp', sent_at: new Date().toISOString(), expires_at: newExpiry })
      .eq('id', invite.id);

    return NextResponse.json({ ok: true, whatsappSent: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha ao reenviar';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
