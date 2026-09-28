import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ autenticado: false }, { status: 401 });
  }

  return NextResponse.json({ autenticado: true, email: user.email });
}