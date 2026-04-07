import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedProfile } from '@/infrastructure/supabase/auth-helpers';
import { createServiceRoleClient } from '@/infrastructure/supabase/server';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const putSchema = z.object({
  apiToken: z.string().min(1, 'Token obrigatorio'),
  channelId: z.string().optional(),
  channelName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

const testSchema = z.object({
  apiToken: z.string().min(1, 'Token obrigatorio'),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FLWCHAT_BASE_URL = 'https://api.flw.chat/v1';

function maskToken(token: string): string {
  if (!token || token.length < 8) return '***';
  return token.slice(0, 3) + '***' + token.slice(-4);
}

interface FlwChatChannel {
  id: string;
  name: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// GET — Read current FlwChat config (from pharmacy.settings)
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { profile, error: authError } = await getAuthenticatedProfile();
    if (authError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createServiceRoleClient();
    const { data: pharmacy, error: dbError } = await admin
      .from('pharmacies')
      .select('settings')
      .eq('id', profile.pharmacy_id)
      .single();

    if (dbError || !pharmacy) {
      return NextResponse.json({ error: 'Farmacia nao encontrada' }, { status: 404 });
    }

    const settings = (pharmacy.settings ?? {}) as Record<string, unknown>;
    const flwchat = (settings.flwchat ?? {}) as Record<string, unknown>;

    return NextResponse.json({
      flwchat: {
        apiToken: flwchat.apiToken ? maskToken(flwchat.apiToken as string) : null,
        channelId: (flwchat.channelId as string) ?? null,
        channelName: (flwchat.channelName as string) ?? null,
        phoneNumber: (flwchat.phoneNumber as string) ?? null,
        connected: Boolean(flwchat.apiToken && flwchat.channelId),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Save FlwChat config to pharmacy.settings.flwchat
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const { profile, error: authError } = await getAuthenticatedProfile();
    if (authError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { apiToken, channelId, channelName, phoneNumber } = parsed.data;

    const admin = createServiceRoleClient();

    // Read existing settings first so we don't overwrite other keys
    const { data: pharmacy } = await admin
      .from('pharmacies')
      .select('settings')
      .eq('id', profile.pharmacy_id)
      .single();

    const currentSettings = ((pharmacy?.settings ?? {}) as Record<string, unknown>);

    const updatedSettings = {
      ...currentSettings,
      flwchat: {
        apiToken,
        channelId: channelId ?? null,
        channelName: channelName ?? null,
        phoneNumber: phoneNumber ?? null,
        updatedAt: new Date().toISOString(),
      },
    };

    const { error: updateError } = await admin
      .from('pharmacies')
      .update({ settings: updatedSettings })
      .eq('id', profile.pharmacy_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao salvar configuracao: ' + updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      flwchat: {
        apiToken: maskToken(apiToken),
        channelId: channelId ?? null,
        channelName: channelName ?? null,
        phoneNumber: phoneNumber ?? null,
        connected: Boolean(channelId),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Test connection to FlwChat API
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { profile, error: authError } = await getAuthenticatedProfile();
    if (authError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { apiToken } = parsed.data;

    // Call FlwChat API to list channels
    const response = await fetch(`${FLWCHAT_BASE_URL}/channel`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) {
        return NextResponse.json(
          { connected: false, error: 'Token invalido ou sem permissao' },
          { status: 200 },
        );
      }
      return NextResponse.json(
        { connected: false, error: `Erro na API FlwChat (HTTP ${status})` },
        { status: 200 },
      );
    }

    const data: unknown = await response.json();

    // The FlwChat API may return an array directly or an object with a data field
    let channels: FlwChatChannel[] = [];
    if (Array.isArray(data)) {
      channels = data as FlwChatChannel[];
    } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as Record<string, unknown>).data)) {
      channels = (data as Record<string, unknown>).data as FlwChatChannel[];
    }

    return NextResponse.json({
      connected: true,
      channels: channels.map((ch) => ({
        id: ch.id,
        name: ch.name ?? ch.id,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao conectar com FlwChat';
    return NextResponse.json(
      { connected: false, error: message },
      { status: 200 },
    );
  }
}
