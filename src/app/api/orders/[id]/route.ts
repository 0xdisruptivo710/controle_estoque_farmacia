import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase/server';
import { SupabaseOrderRepository } from '@/infrastructure/repositories/SupabaseOrderRepository';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const repo = new SupabaseOrderRepository(supabase);
    const order = await repo.findById(id);

    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
