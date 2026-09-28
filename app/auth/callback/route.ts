import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const codigo = searchParams.get('code');
  const siguiente = searchParams.get('next') ?? '/dashboard';

  if (!codigo) {
    return NextResponse.redirect(`${origin}/login?error=confirmacion`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=confirmacion`);
  }

  const destino = siguiente.startsWith('/') ? siguiente : '/dashboard';
  return NextResponse.redirect(`${origin}${destino}`);
}
