import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/infrastructure/supabase/server';
import { getAuthenticatedProfile } from '@/infrastructure/supabase/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const { user, error: authErr } = await getAuthenticatedProfile();
    if (authErr === 'Unauthorized' || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { endpoint, keys } = await request.json();

    const admin = createServiceRoleClient();
    const { error } = await admin
      .from('profiles')
      .update({
        push_endpoint: endpoint,
        push_keys: keys,
      })
      .eq('id', user.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
