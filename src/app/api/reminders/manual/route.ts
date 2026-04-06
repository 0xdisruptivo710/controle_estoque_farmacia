import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedProfile } from '@/infrastructure/supabase/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const { user, profile, supabase, error: authErr } = await getAuthenticatedProfile();
    if (authErr === 'Unauthorized') return NextResponse.json({ error: authErr }, { status: 401 });
    if (!profile || !user) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const body = await request.json();
    const { customerId, productId, scheduledDate, channel, customMessage, isRecurring, recurringDays } = body;

    if (!customerId || !scheduledDate) {
      return NextResponse.json({ error: 'Cliente e data sao obrigatorios.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('repurchase_reminders')
      .insert({
        pharmacy_id: profile.pharmacy_id,
        customer_id: customerId,
        product_id: productId || null,
        scheduled_date: scheduledDate,
        status: 'scheduled',
        channel: channel || 'whatsapp',
        custom_message: customMessage || null,
        created_by: user.id,
        notes: isRecurring ? `RECORRENTE:${recurringDays || 30}` : null,
      })
      .select('*, customers(full_name), products(name)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
