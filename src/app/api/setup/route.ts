import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/infrastructure/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[setup] Auth error:', authError.message);
      return NextResponse.json({ error: `Auth: ${authError.message}` }, { status: 401 });
    }

    if (!user) {
      console.error('[setup] No user found');
      return NextResponse.json({ error: 'Nao autenticado. Faca login novamente.' }, { status: 401 });
    }

    console.log('[setup] User:', user.id, user.email);

    const body = await request.json();
    const { pharmacyName, pharmacyCnpj, pharmacyPhone, pharmacyEmail } = body;

    const admin = createServiceRoleClient();

    // Check if user already has a profile
    const { data: existingProfile, error: profileCheckError } = await admin
      .from('profiles')
      .select('id, pharmacy_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileCheckError) {
      console.error('[setup] Profile check error:', profileCheckError.message);
    }

    if (existingProfile?.pharmacy_id) {
      console.log('[setup] Profile already exists:', existingProfile.pharmacy_id);
      return NextResponse.json({ pharmacyId: existingProfile.pharmacy_id });
    }

    // Create pharmacy
    const { data: pharmacy, error: pharmacyError } = await admin
      .from('pharmacies')
      .insert({
        name: pharmacyName || 'Minha Farmacia',
        cnpj: pharmacyCnpj || null,
        phone: pharmacyPhone || null,
        email: pharmacyEmail || user.email,
      })
      .select()
      .single();

    if (pharmacyError) {
      console.error('[setup] Pharmacy creation error:', pharmacyError);
      return NextResponse.json({ error: `Farmacia: ${pharmacyError.message}` }, { status: 500 });
    }

    console.log('[setup] Pharmacy created:', pharmacy.id);

    // Create profile linked to pharmacy
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: user.id,
        pharmacy_id: pharmacy.id,
        full_name: user.user_metadata?.full_name || 'Administrador',
        role: 'admin',
        phone: pharmacyPhone || null,
      });

    if (profileError) {
      console.error('[setup] Profile creation error:', profileError);
      return NextResponse.json({ error: `Perfil: ${profileError.message}` }, { status: 500 });
    }

    console.log('[setup] Profile created for user:', user.id);
    return NextResponse.json({ pharmacyId: pharmacy.id, success: true });
  } catch (error) {
    console.error('[setup] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
