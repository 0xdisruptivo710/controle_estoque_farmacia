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
    const whatsapp = new FlwChatWhatsAppService();
    const push = new WebPushService();

    const notificationService = {
      sendWhatsApp: (to: string, message: string) => whatsapp.sendWhatsApp(to, message),
      sendPush: (endpoint: string, payload: string) => push.sendPush(endpoint, payload),
    };

    const useCase = new SendPendingRemindersUseCase(
      new SupabaseReminderRepository(supabase),
      notificationService,
    );

    const result = await useCase.execute({ date: new Date() });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
