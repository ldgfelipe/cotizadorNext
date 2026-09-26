import { NextResponse } from 'next/server';
import { obtenerINPC, procesarCotizacion } from '@/lib/calculator';

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

    return NextResponse.json({ success: true, resultado });
  } catch (error) {
    console.error('Error al calcular cotización:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
