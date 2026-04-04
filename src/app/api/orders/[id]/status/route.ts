import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase/server';
import { SupabaseOrderRepository } from '@/infrastructure/repositories/SupabaseOrderRepository';
import { UpdateOrderStatusUseCase } from '@/application/use-cases/orders/UpdateOrderStatusUseCase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const useCase = new UpdateOrderStatusUseCase(new SupabaseOrderRepository(supabase));
    const result = await useCase.execute(id, { ...body, updatedBy: user.id });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    const status = message.includes('inválida') ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
