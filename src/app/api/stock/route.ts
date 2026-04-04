import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase/server';
import { SupabaseStockRepository } from '@/infrastructure/repositories/SupabaseStockRepository';
import { GetStockDashboardUseCase } from '@/application/use-cases/stock/GetStockDashboardUseCase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const pharmacyId = request.nextUrl.searchParams.get('pharmacyId') ?? '';
    const useCase = new GetStockDashboardUseCase(new SupabaseStockRepository(supabase));
    const result = await useCase.execute(pharmacyId);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
