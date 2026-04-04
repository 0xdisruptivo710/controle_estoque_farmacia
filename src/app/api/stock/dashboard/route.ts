import { NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase/server';

export async function GET() {
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

    const pharmacyId = profile.pharmacy_id;

    // Get all products for this pharmacy
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, unit_of_measure, minimum_stock, maximum_stock, category')
      .eq('pharmacy_id', pharmacyId)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (prodError) return NextResponse.json({ error: prodError.message }, { status: 500 });

    // Get all stock items for this pharmacy
    const { data: stockItems, error: stockError } = await supabase
      .from('stock_items')
      .select('id, product_id, quantity, expiration_date, alert_level')
      .eq('pharmacy_id', pharmacyId)
      .is('deleted_at', null);

    if (stockError) return NextResponse.json({ error: stockError.message }, { status: 500 });

    // Build summaries per product
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);

    const summaries = (products ?? []).map((product) => {
      const items = (stockItems ?? []).filter((si) => si.product_id === product.id);
      const totalQuantity = items.reduce((sum, si) => sum + Number(si.quantity), 0);
      const lotCount = items.length;
      const nearestExpiration = items
        .map((si) => si.expiration_date)
        .filter(Boolean)
        .sort()[0] ?? null;

      const minimumStock = Number(product.minimum_stock) || 0;
      let alertLevel = 'ok';
      if (totalQuantity <= 0 && lotCount > 0) alertLevel = 'critical';
      else if (totalQuantity > 0 && totalQuantity <= minimumStock) alertLevel = 'warning';

      return {
        productId: product.id,
        productName: product.name,
        unitOfMeasure: product.unit_of_measure,
        minimumStock,
        maximumStock: product.maximum_stock,
        category: product.category,
        totalQuantity,
        lotCount,
        nearestExpiration,
        alertLevel,
      };
    });

    // Products with stock entries
    const withStock = summaries.filter((s) => s.lotCount > 0);

    const criticalAlerts = withStock.filter((s) => s.alertLevel === 'critical').length;
    const warningAlerts = withStock.filter((s) => s.alertLevel === 'warning').length;
    const expiringThisMonth = withStock.filter((s) => {
      if (!s.nearestExpiration) return false;
      return new Date(s.nearestExpiration) <= endOfMonth;
    }).length;

    return NextResponse.json({
      totalProducts: (products ?? []).length,
      productsWithStock: withStock.length,
      criticalAlerts,
      warningAlerts,
      expiringThisMonth,
      summaries,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
