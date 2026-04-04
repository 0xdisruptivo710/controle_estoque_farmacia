import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase/server';

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

    // Create stock item (lot)
    const { data: stockItem, error: itemError } = await supabase
      .from('stock_items')
      .insert({
        pharmacy_id: profile.pharmacy_id,
        product_id: body.productId,
        lot_number: body.lotNumber || null,
        quantity: body.quantity,
        unit_cost: body.unitCost || null,
        expiration_date: body.expirationDate || null,
        location: body.location || null,
        notes: body.notes || null,
      })
      .select('*, products(name)')
      .single();

    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });

    // Register the entry movement
    const { error: movError } = await supabase
      .from('stock_movements')
      .insert({
        pharmacy_id: profile.pharmacy_id,
        stock_item_id: stockItem.id,
        product_id: body.productId,
        movement_type: 'entry',
        quantity: body.quantity,
        quantity_before: 0,
        quantity_after: body.quantity,
        unit_cost: body.unitCost || null,
        reason: body.reason || 'Entrada inicial de estoque',
        reference_doc: body.referenceDoc || null,
        performed_by: user.id,
      });

    if (movError) {
      console.error('[stock/items] Movement error:', movError.message);
    }

    return NextResponse.json(stockItem, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const productId = request.nextUrl.searchParams.get('productId');

    let query = supabase
      .from('stock_items')
      .select('*, products(name, unit_of_measure, minimum_stock)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
