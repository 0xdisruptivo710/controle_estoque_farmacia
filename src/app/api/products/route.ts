import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase/server';
import { SupabaseProductRepository } from '@/infrastructure/repositories/SupabaseProductRepository';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('pharmacy_id')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const repo = new SupabaseProductRepository(supabase);
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const category = searchParams.get('category') ?? undefined;
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 50);

    const result = await repo.findByPharmacy(profile.pharmacy_id, {
      search,
      category: category as 'raw_material' | 'compound_formula' | 'finished_product' | 'packaging' | 'other' | undefined,
      page,
      limit,
      isActive: true,
    });

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('pharmacy_id')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const body = await request.json();

    const { data, error } = await supabase
      .from('products')
      .insert({
        pharmacy_id: profile.pharmacy_id,
        name: body.name,
        active_ingredient: body.activeIngredient || null,
        code: body.code || null,
        barcode: body.barcode || null,
        category: body.category || 'other',
        unit_of_measure: body.unitOfMeasure,
        description: body.description || null,
        minimum_stock: body.minimumStock ?? 0,
        maximum_stock: body.maximumStock || null,
        reorder_point: body.reorderPoint || null,
        repurchase_cycle_days: body.repurchaseCycleDays || null,
        unit_cost: body.unitCost || null,
        unit_price: body.unitPrice || null,
        is_controlled: body.isControlled ?? false,
        requires_prescription: body.requiresPrescription ?? false,
        anvisa_code: body.anvisaCode || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
