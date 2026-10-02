import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server';
import { PAQUETES_CREDITOS, capturarOrdenPaypal } from '@/lib/paypal';

// PayPal redirige de vuelta aquí tras la aprobación del comprador,
// con el token (id de la orden) y el paquete que se compró.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const paquete = searchParams.get('paquete');

  if (!token) {
    return NextResponse.redirect(
      new URL('/credits?cancelado=1', request.url)
    );
  }

  const creditos = paquete ? PAQUETES_CREDITOS[paquete] : undefined;

  if (!creditos) {
    return NextResponse.redirect(
      new URL('/credits?error=paquete', request.url)
    );
  }

  try {
    const captura = await capturarOrdenPaypal(token);

    if (captura.status !== 'COMPLETED') {
      return NextResponse.redirect(
        new URL('/credits?error=no-completado', request.url)
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?redirect=%2Fcredits', request.url)
      );
    }

    const { error } = await supabase.from('credit_purchases').insert({
      user_id: user.id,
      package: paquete,
      credits: creditos,
      amount: 0,
      status: 'completed',
      // nota: el monto real queda en el registro de PayPal (id de la orden)
    });

    if (error) {
      console.error('Error registrando compra PayPal:', error);
      return NextResponse.redirect(
        new URL('/credits?error=registro', request.url)
      );
    }

    return NextResponse.redirect(
      new URL(`/credits?exito=1&creditos=${creditos}`, request.url)
    );
  } catch (error) {
    console.error('Error capturando orden PayPal:', error);
    return NextResponse.redirect(
      new URL('/credits?error=captura', request.url)
    );
  }
}