import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requirePharmacyAdmin } from '@/infrastructure/supabase/auth-helpers';
import { FlwChatWhatsAppService } from '@/infrastructure/services/FlwChatWhatsAppService';

const EXPIRY_DAYS = 7;

export async function GET() {
  const ctx = await requirePharmacyAdmin();
  if (ctx.error) {
    const status = ctx.error === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ error: ctx.error }, { status });
  }

  const { data, error } = await ctx.admin
    .from('x3_invitations')
    .select('id, full_name, email, whatsapp, role, token, sent_via, sent_at, expires_at, created_at')
    .eq('pharmacy_id', ctx.profile.pharmacy_id)
    .is('revoked_at', null)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const invitations = (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    whatsapp: row.whatsapp,
    role: row.role,
    sentVia: row.sent_via,
    sentAt: row.sent_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    inviteUrl: `${appUrl}/invite/${row.token}`,
    isExpired: new Date(row.expires_at) < new Date(),
  }));

  return NextResponse.json({ invitations });
}

export async function POST(request: NextRequest) {
  const ctx = await requirePharmacyAdmin();
  if (ctx.error) {
    const status = ctx.error === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ error: ctx.error }, { status });
  }

  const body = await request.json().catch(() => ({}));
  const fullName: string = (body.fullName ?? '').trim();
  const email: string = (body.email ?? '').trim().toLowerCase();
  const whatsapp: string | null = (body.whatsapp ?? '').trim() || null;
  const role: 'pharmacist' | 'attendant' = body.role;

  if (!fullName) return NextResponse.json({ error: 'Nome e obrigatorio.' }, { status: 400 });
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'E-mail invalido.' }, { status: 400 });
  if (role !== 'pharmacist' && role !== 'attendant') {
    return NextResponse.json({ error: 'Papel deve ser pharmacist ou attendant.' }, { status: 400 });
  }

  // Reject if email is already in auth.users
  const { data: authList } = await ctx.admin.auth.admin.listUsers({ perPage: 500 });
  if (authList?.users.some((u) => u.email?.toLowerCase() === email)) {
    return NextResponse.json({ error: 'Ja existe uma conta com este e-mail.' }, { status: 409 });
  }

  // Reject if there's a pending invite for the same email in this pharmacy
  const { data: existing } = await ctx.admin
    .from('x3_invitations')
    .select('id')
    .eq('pharmacy_id', ctx.profile.pharmacy_id)
    .ilike('email', email)
    .is('revoked_at', null)
    .is('accepted_at', null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Ja existe um convite pendente para este e-mail.' }, { status: 409 });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 86400_000).toISOString();

  const { data: invite, error: insertError } = await ctx.admin
    .from('x3_invitations')
    .insert({
      pharmacy_id: ctx.profile.pharmacy_id,
      full_name: fullName,
      email,
      whatsapp,
      role,
      token,
      invited_by: ctx.user.id,
      expires_at: expiresAt,
    })
    .select('id, token')
    .single();

  if (insertError || !invite) {
    return NextResponse.json({ error: insertError?.message ?? 'Erro ao criar convite.' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  // Try WhatsApp auto-send if we have the number + FlwChat config
  let whatsappSent = false;
  let whatsappError: string | null = null;
  if (whatsapp) {
    const { data: pharmacy } = await ctx.admin
      .from('pharmacies')
      .select('name, phone, settings')
      .eq('id', ctx.profile.pharmacy_id)
      .maybeSingle();

    const settings = (pharmacy?.settings ?? {}) as { flwchat?: { apiUrl?: string; apiToken?: string; fromPhone?: string } };
    const flwConfig = settings.flwchat;
    const apiToken = flwConfig?.apiToken ?? process.env.FLWCHAT_API_TOKEN;

    if (apiToken) {
      try {
        const service = new FlwChatWhatsAppService({
          apiUrl: flwConfig?.apiUrl,
          apiToken,
          fromPhone: flwConfig?.fromPhone ?? null,
        });
        const roleLabel = role === 'pharmacist' ? 'Farmaceutica' : 'Atendente';
        const pharmacyName = pharmacy?.name ?? 'sua farmacia';
        const message =
          `Ola, ${fullName}! Voce foi convidado para entrar no PharmaControl como ${roleLabel} em ${pharmacyName}.\n\n` +
          `Aceite seu convite e defina sua senha (valido por ${EXPIRY_DAYS} dias):\n${inviteUrl}`;

        await service.sendWhatsApp(whatsapp, message);
        whatsappSent = true;
        await ctx.admin
          .from('x3_invitations')
          .update({ sent_via: 'whatsapp', sent_at: new Date().toISOString() })
          .eq('id', invite.id);
      } catch (err) {
        whatsappError = err instanceof Error ? err.message : 'Falha ao enviar WhatsApp';
      }
    } else {
      whatsappError = 'FlwChat nao configurado — use o link manual.';
    }
  }

  return NextResponse.json(
    {
      id: invite.id,
      inviteUrl,
      whatsappSent,
      whatsappError,
    },
    { status: 201 },
  );
}
