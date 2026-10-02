import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server';
import { PAQUETES_CREDITOS, paypalConfigurado } from '@/lib/paypal';

// Endpoint: GET /api/paypal - paquetes y modo de pago
export async function GET() {
  return NextResponse.json({
    ...PAQUETES_CREDITOS,
    modo: paypalConfigurado() ? 'paypal' : 'simulacion',
  });
}

// Endpoint: POST /api/paypal - compra simulada (fallback; la web usa
// /api/paypal/create-order que decide entre PayPal real o simulación).
export async function POST(request: Request) {
  try {
    const { monto, paquete } = await request.json();

    const creditos = PAQUETES_CREDITOS[paquete];

    if (!monto || !creditos) {
      return NextResponse.json(
        { error: 'Faltan parámetros: monto y paquete' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para comprar créditos' },
        { status: 401 }
      );
    }

    const ordenId = `simulada_${Date.now()}`;

    const { error } = await supabase.from('credit_purchases').insert({
      user_id: user.id,
      package: paquete,
      credits: creditos,
      amount: Number(monto),
      status: 'completed',
    });

    if (error) {
      console.error('Error registrando compra simulada:', error);
      return NextResponse.json(
        { error: 'No fue posible registrar la compra' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ordenId,
      creditosAgregados: creditos,
      mensaje: 'Pago simulado exitoso - créditos agregados a la cuenta',
    });
  } catch (error) {
    console.error('Error en pago PayPal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}