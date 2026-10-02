import { NextResponse } from 'next/server';
import { obtenerINPC, procesarCotizacion } from '@/lib/calculator';
import { createServerSupabaseClient } from '@/lib/server';

const CAMPOS_REQUERIDOS = [
  'fecha_venta',
  'fecha_adquisicion',
  'valor_escritura',
  'porcentaje_enajenante',
  'valor_terreno',
  'valor_constr',
] as const;

const CAMPOS_NUMERICOS = [
  'valor_escritura',
  'porcentaje_enajenante',
  'valor_terreno',
  'valor_constr',
] as const;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para usar el cotizador' },
        { status: 401 }
      );
    }

    // --- Validación de créditos disponibles ---
    const [compras, { count: cotizacionesCount }] = await Promise.all([
      supabase
        .from('credit_purchases')
        .select('credits')
        .eq('status', 'completed'),
      supabase.from('quote_records').select('*', { count: 'exact', head: true }),
    ]);

    const creditosComprados = compras.data?.reduce((suma, c) => suma + c.credits, 0) ?? 0;
    const creditosUsados = cotizacionesCount ?? 0;
    const creditosDisponibles = creditosComprados - creditosUsados;

    if (creditosDisponibles < 1) {
      return NextResponse.json(
        {
          error: 'No tienes créditos suficientes. Canjea un cupón o compra créditos.',
          codigo: 'SIN_CREDITOS',
          disponibles: creditosDisponibles,
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const faltantes = CAMPOS_REQUERIDOS.filter((campo) => {
      const valor = body[campo];
      return valor === undefined || valor === null || valor === '';
    });

    if (faltantes.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos obligatorios: ${faltantes.join(', ')}` },
        { status: 400 }
      );
    }

    const numeros: Record<string, number> = {};

    for (const campo of CAMPOS_NUMERICOS) {
      const valor = Number(body[campo]);

      if (!Number.isFinite(valor)) {
        return NextResponse.json(
          { error: `El campo ${campo} debe ser numérico` },
          { status: 400 }
        );
      }

      numeros[campo] = valor;
    }

    const fechasInvalidas =
      Number.isNaN(Date.parse(body.fecha_venta)) ||
      Number.isNaN(Date.parse(body.fecha_adquisicion));

    if (fechasInvalidas) {
      return NextResponse.json(
        { error: 'Las fechas no tienen un formato válido' },
        { status: 400 }
      );
    }

    const [inpcVenta, inpcAdquisicion] = await Promise.all([
      obtenerINPC(body.fecha_venta),
      obtenerINPC(body.fecha_adquisicion),
    ]);

    const resultado = await procesarCotizacion(
      {
        fecha_venta: body.fecha_venta,
        fecha_adquisicion: body.fecha_adquisicion,
        exenta: Boolean(body.exenta),
        valor_escritura: numeros.valor_escritura,
        porcentaje_enajenante: numeros.porcentaje_enajenante,
        valor_terreno: numeros.valor_terreno,
        valor_constr: numeros.valor_constr,
      },
      inpcVenta,
      inpcAdquisicion
    );

    // Guardar cotización de forma atómica (valida créditos dentro de la BD
// con bloqueo por usuario para evitar dos gastos simultáneos).
    let clientId: string | null = null;
    const solicitado = typeof body.client_id === 'string' ? body.client_id : '';

    if (solicitado) {
      const { data: cliente } = await supabase
        .from('clients')
        .select('id')
        .eq('id', solicitado)
        .eq('user_id', user.id)
        .maybeSingle();

      if (cliente) clientId = cliente.id;
    }

    const { data: idCotizacion, error: errorRpc } = await supabase.rpc(
      'generar_cotizacion',
      {
        in_client_id: clientId,
        in_input_data: {
          fecha_venta: body.fecha_venta,
          fecha_adquisicion: body.fecha_adquisicion,
          valor_escritura: numeros.valor_escritura,
          porcentaje_enajenante: numeros.porcentaje_enajenante,
          valor_terreno: numeros.valor_terreno,
          valor_constr: numeros.valor_constr,
          exenta: Boolean(body.exenta),
        },
        // guardar también el desglose de movimientos para poder imprimirlo después
        in_result_data: resultado,
      }
    );

    if (errorRpc) {
      if (errorRpc.message.includes('SIN_CREDITOS')) {
        return NextResponse.json(
          {
            error: 'No tienes créditos suficientes. Compra créditos o canjea un cupón.',
            codigo: 'SIN_CREDITOS',
            disponibles: 0,
          },
          { status: 403 }
        );
      }
      console.error('Error guardando cotización:', errorRpc);
      return NextResponse.json(
        { error: 'No fue posible guardar la cotización' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, idCotizacion, resultado });
  } catch (error) {
    console.error('Error al calcular cotización:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}