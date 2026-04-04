import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/infrastructure/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();

    // Update queued notifications older than 5 minutes to 'sent' status
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: updatedData } = await supabase
      .from('notification_logs')
      .update({ status: 'sent' })
      .eq('status', 'queued')
      .lt('created_at', fiveMinutesAgo)
      .select();

    // Mark old 'sent' notifications as 'delivered' (assume delivered after 30 min)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: deliveredData } = await supabase
      .from('notification_logs')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('status', 'sent')
      .lt('sent_at', thirtyMinutesAgo)
      .select();

    return NextResponse.json({
      success: true,
      updated: updatedData?.length ?? 0,
      delivered: deliveredData?.length ?? 0,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
