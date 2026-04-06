import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/infrastructure/supabase/server';
import { getAuthenticatedProfile } from '@/infrastructure/supabase/auth-helpers';
import { WebPushService } from '@/infrastructure/services/WebPushService';

export async function POST(request: NextRequest) {
  try {
    const { error: authErr } = await getAuthenticatedProfile();
    if (authErr === 'Unauthorized') return NextResponse.json({ error: authErr }, { status: 401 });

    const { profileId, title, body } = await request.json();

    const admin = createServiceRoleClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('push_endpoint, push_keys')
      .eq('id', profileId)
      .single();

    if (!profile?.push_endpoint) {
      return NextResponse.json({ error: 'Usuário sem push configurado' }, { status: 404 });
    }

    const pushService = new WebPushService();
    const payload = JSON.stringify({ title, body, icon: '/icon-192.png' });
    await pushService.sendPush(
      profile.push_endpoint,
      payload,
      profile.push_keys as { p256dh: string; auth: string },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
