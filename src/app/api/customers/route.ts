import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase/server';
import { SupabaseCustomerRepository } from '@/infrastructure/repositories/SupabaseCustomerRepository';
import { CreateCustomerUseCase } from '@/application/use-cases/customers/CreateCustomerUseCase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const repo = new SupabaseCustomerRepository(supabase);
    const { searchParams } = request.nextUrl;
    const pharmacyId = searchParams.get('pharmacyId') ?? '';
    const search = searchParams.get('search') ?? undefined;
    const status = searchParams.get('status') as 'active' | 'inactive' | 'pending_repurchase' | undefined;
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 20);

    const result = await repo.findByPharmacy(pharmacyId, { search, status, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const repo = new SupabaseCustomerRepository(supabase);
    const useCase = new CreateCustomerUseCase(repo);
    const result = await useCase.execute({ ...body, createdBy: user.id });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    const status = message.includes('CPF') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
