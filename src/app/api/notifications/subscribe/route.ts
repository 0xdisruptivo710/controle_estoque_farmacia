import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { endpoint, keys } = await request.json();

    const { error } = await supabase
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
