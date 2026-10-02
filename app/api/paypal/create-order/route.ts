import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server';
import {
  PAQUETES_CREDITOS,
  PRECIOS_PAQUETES,
  crearOrdenPaypal,
  paypalConfigurado,
} from '@/lib/paypal';

export async function POST(request: Request) {
  try {
    const { paquete } = await request.json();

    const creditos = PAQUETES_CREDITOS[paquete];
    const precio = PRECIOS_PAQUETES[paquete];

    if (!creditos || !precio) {
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

    // --- Modo simulación (sin credenciales PayPal) ---
    if (!paypalConfigurado()) {
      const ordenId = `simulada_${Date.now()}`;

      const { error } = await supabase.from('credit_purchases').insert({
        user_id: user.id,
        package: paquete,
        credits: creditos,
        amount: precio,
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
        modo: 'simulacion',
        ordenId,
        creditosAgregados: creditos,
        mensaje: 'Pago simulado exitoso - créditos agregados a la cuenta',
      });
    }

    // --- Modo PayPal real ---
    try {
      const protocolo = request.headers.get('x-forwarded-proto') ?? 'https';
      const host = request.headers.get('host');
      const base = `${protocolo}://${host}`;

      const orden = await crearOrdenPaypal(paquete, base);

      return NextResponse.json({
        modo: 'paypal',
        ordenId: orden.id,
        aprobacion: orden.aprobacion,
      });
    } catch (error) {
      console.error('Error creando orden PayPal:', error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'No fue posible crear la orden de pago',
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error en /api/paypal/create-order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}