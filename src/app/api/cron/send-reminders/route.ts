import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/infrastructure/supabase/server';
import { SupabaseReminderRepository } from '@/infrastructure/repositories/SupabaseReminderRepository';
import { SendPendingRemindersUseCase } from '@/application/use-cases/reminders/SendPendingRemindersUseCase';
import { FlwChatWhatsAppService } from '@/infrastructure/services/FlwChatWhatsAppService';
import { WebPushService } from '@/infrastructure/services/WebPushService';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();

    // Read FlwChat config from all active pharmacies and send reminders per pharmacy
    const { data: pharmacies } = await supabase
      .from('pharmacies')
      .select('id, settings')
      .eq('is_active', true)
      .is('deleted_at', null);

    let totalSent = 0;
    let totalFailed = 0;
    let totalCount = 0;

    for (const pharmacy of pharmacies ?? []) {
      const settings = (pharmacy.settings ?? {}) as Record<string, unknown>;
      const flwchat = (settings.flwchat ?? {}) as Record<string, unknown>;
      const apiToken = flwchat.apiToken as string | undefined;
      const fromPhone = flwchat.phoneNumber as string | undefined;

      if (!apiToken) continue; // Skip pharmacies without FlwChat configured

      const whatsapp = new FlwChatWhatsAppService({
        apiToken,
        fromPhone: fromPhone ?? null,
      });
      const push = new WebPushService();

      const notificationService = {
        sendWhatsApp: (to: string, message: string) => whatsapp.sendWhatsApp(to, message),
        sendPush: (endpoint: string, payload: string) => push.sendPush(endpoint, payload),
      };

      const repo = new SupabaseReminderRepository(supabase);
      const useCase = new SendPendingRemindersUseCase(repo, notificationService);
      const result = await useCase.execute({ date: new Date() });

      totalCount += result.count;
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    return NextResponse.json({
      success: true,
      count: totalCount,
      sent: totalSent,
      failed: totalFailed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
