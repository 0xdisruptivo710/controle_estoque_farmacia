import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase/server';
import { SupabaseStockRepository } from '@/infrastructure/repositories/SupabaseStockRepository';
import { RegisterStockMovementUseCase } from '@/application/use-cases/stock/RegisterStockMovementUseCase';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const useCase = new RegisterStockMovementUseCase(new SupabaseStockRepository(supabase));
    const result = await useCase.execute({ ...body, performedBy: user.id });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
