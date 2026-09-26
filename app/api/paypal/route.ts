import { NextResponse } from 'next/server';

// Tarifas de créditos - pueden ser configuradas desde el panel admin
const PAQUETES_CREDITOS = {
  basico: 10, // 10 cotizaciones por $X
  profesional: 20, // 20 cotizaciones por $35
  enterprise: 50, // 50 cotizaciones por $80
};

// Endpoint: POST /api/paypal/create-order
export async function POST(request: Request) {
  try {
    const { monto, paquete } = await request.json();

    if (!monto || !paquete) {
      return NextResponse.json(
        { error: 'Faltan parámetros: monto y paquete' },
        { status: 400 }
      );
    }

    // Verificar paquete válido
    if (!Object.values(PAQUETES_CREDITOS).includes(paquete)) {
      return NextResponse.json(
        { error: 'Paquete inválido' },
        { status: 400 }
      );
    }

    // En un caso real, aquí integraríamos con PayPal SDK
    // Por ahora simulamos el proceso:
    
    // 1. Crear orden en PayPal (simulado)
    const ordenId = `paypal_order_${Date.now()}`;
    
    // 2. Sumar créditos al usuario (requiere usuario autenticado)
    // NOTA: Esto requiere que el usuario esté logueado en Supabase Auth
    // const supabase = createServerClient();
    // const { error } = await supabase.from('user_credits').increment('creditos_disponibles', paquete);
    
    // Por ahora retornamos éxito simulado
    return NextResponse.json({
      success: true,
      ordenId,
      creditosAgregados: paquete,
      mensaje: 'Pago simulado exitoso - créditos agregados a la cuenta'
    });

  } catch (error) {
    console.error('Error en pago PayPal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint: GET /api/paypal/pricing - obtener precios de paquetes
export async function GET() {
  return NextResponse.json(PAQUETES_CREDITOS);
}