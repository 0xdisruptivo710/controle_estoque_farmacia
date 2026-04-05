import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/infrastructure/supabase/server';

function isValidCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (slice: string, weights: number[]) =>
    weights.reduce((sum, w, i) => sum + parseInt(slice[i]) * w, 0);

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calc(digits, w1) % 11;
  const check1 = d1 < 2 ? 0 : 11 - d1;
  if (parseInt(digits[12]) !== check1) return false;

  const d2 = calc(digits, w2) % 11;
  const check2 = d2 < 2 ? 0 : 11 - d2;
  if (parseInt(digits[13]) !== check2) return false;

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ error: `Auth: ${authError.message}` }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado. Faca login novamente.' }, { status: 401 });
    }

    const body = await request.json();
    const { pharmacyName, pharmacyCnpj, pharmacyPhone, pharmacyEmail } = body;

    if (!pharmacyName?.trim()) {
      return NextResponse.json({ error: 'Nome da farmacia e obrigatorio.' }, { status: 400 });
    }

    // Validate CNPJ format if provided
    if (pharmacyCnpj?.trim() && !isValidCNPJ(pharmacyCnpj)) {
      return NextResponse.json({ error: 'CNPJ invalido. Verifique os digitos.' }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const cleanCnpj = pharmacyCnpj?.replace(/\D/g, '') || null;

    // 1. Check if user already has a profile with pharmacy
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, pharmacy_id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile?.pharmacy_id) {
      return NextResponse.json({ pharmacyId: existingProfile.pharmacy_id, success: true });
    }

    // 2. Check CNPJ uniqueness if provided
    if (cleanCnpj) {
      const { data: existingPharmacy } = await admin
        .from('pharmacies')
        .select('id')
        .eq('cnpj', cleanCnpj)
        .maybeSingle();

      if (existingPharmacy) {
        return NextResponse.json({ error: 'Ja existe uma farmacia cadastrada com este CNPJ.' }, { status: 409 });
      }
    }

    // 3. Check email uniqueness if provided
    const emailToUse = pharmacyEmail?.trim() || user.email;
    if (emailToUse) {
      const { data: existingEmail } = await admin
        .from('pharmacies')
        .select('id')
        .eq('email', emailToUse)
        .maybeSingle();

      if (existingEmail) {
        return NextResponse.json({ error: 'Ja existe uma farmacia cadastrada com este e-mail.' }, { status: 409 });
      }
    }

    // 4. Create pharmacy
    const { data: pharmacy, error: pharmacyError } = await admin
      .from('pharmacies')
      .insert({
        name: pharmacyName.trim(),
        cnpj: cleanCnpj,
        phone: pharmacyPhone?.trim() || null,
        email: emailToUse,
      })
      .select()
      .single();

    if (pharmacyError) {
      console.error('[setup] Pharmacy creation error:', pharmacyError);
      return NextResponse.json({ error: 'Erro ao criar farmacia. Tente novamente.' }, { status: 500 });
    }

    // 5. Link profile to pharmacy (atomic upsert — INSERT or UPDATE in one op)
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        pharmacy_id: pharmacy.id,
        full_name: user.user_metadata?.full_name || 'Administrador',
        role: 'admin',
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('[setup] Profile upsert error:', profileError);
      // Rollback: remove orphan pharmacy
      await admin.from('pharmacies').delete().eq('id', pharmacy.id);
      return NextResponse.json({ error: 'Erro ao criar perfil. Tente novamente.' }, { status: 500 });
    }

    console.log('[setup] Setup complete — user:', user.id, 'pharmacy:', pharmacy.id);
    return NextResponse.json({ pharmacyId: pharmacy.id, success: true });
  } catch (error) {
    console.error('[setup] Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
  }
}
