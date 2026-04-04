import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/infrastructure/supabase/server';
import { SupabaseStockRepository } from '@/infrastructure/repositories/SupabaseStockRepository';
import { CheckStockAlertsUseCase } from '@/application/use-cases/stock/CheckStockAlertsUseCase';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();

    // Refresh alert levels via DB function
    await supabase.rpc('refresh_stock_alert_levels');

    // Get current alerts for logging
    const repo = new SupabaseStockRepository(supabase);
    const useCase = new CheckStockAlertsUseCase(repo);

    // Check all pharmacies
    const { data: pharmacies } = await supabase
      .from('pharmacies')
      .select('id')
      .eq('is_active', true)
      .is('deleted_at', null);

    let totalCritical = 0;
    let totalWarning = 0;

    for (const pharmacy of pharmacies ?? []) {
      const result = await useCase.execute(pharmacy.id);
      totalCritical += result.critical.length;
      totalWarning += result.warning.length;
    }

    return NextResponse.json({
      success: true,
      critical: totalCritical,
      warning: totalWarning,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
