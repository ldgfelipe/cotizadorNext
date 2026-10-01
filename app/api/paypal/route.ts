import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server';

// Tarifas de créditos - pueden ser configuradas desde el panel admin
const PAQUETES_CREDITOS: Record<string, number> = {
  basico: 10, // 10 cotizaciones
  profesional: 20, // 20 cotizaciones
  enterprise: 50, // 50 cotizaciones
};

// Endpoint: POST /api/paypal - simula una compra y registra los créditos
export async function POST(request: Request) {
  try {
    const { monto, paquete } = await request.json();

    if (!monto || !paquete) {
      return NextResponse.json(
        { error: 'Faltan parámetros: monto y paquete' },
        { status: 400 }
      );
    }

    const creditos = PAQUETES_CREDITOS[paquete];
    if (!creditos) {
      return NextResponse.json(
        { error: 'Paquete inválido' },
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

    // En un caso real aquí se crearía la orden con el SDK de PayPal.
    // Por ahora simulamos el pago y registramos la compra como exitosa.
    const ordenId = `paypal_order_${Date.now()}`;

    const { error } = await supabase.from('credit_purchases').insert({
      user_id: user.id,
      package: paquete,
      credits: creditos,
      amount: Number(monto),
      status: 'completed',
    });

    if (error) {
      console.error('Error registrando compra de créditos:', error);
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

// Endpoint: GET /api/paypal - obtener precios de paquetes
export async function GET() {
  return NextResponse.json(PAQUETES_CREDITOS);
}