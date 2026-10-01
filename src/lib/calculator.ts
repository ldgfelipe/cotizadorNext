// Server-Side ISR Calculator for Next.js
// Lógica matemática replicando el Excel de referencia:
// 1. Obtener UDI actual
// 2. Calcular factor de ajuste por años
// 3. Traer a valor presente (INPC ratio)
// 4. Restar deducciones y exenciones a la ganancia para obtener la base gravable
// 5. Aplicar la tabla de ISR (Límite inferior, porcentaje excedente, cuota fija)

// Tipos para la entrada de datos
export interface CotizacionDatos {
  fecha_venta: string;
  valor_escritura: number;
  porcentaje_enajenante: number;
  exenta: boolean;
  valor_terreno: number;
  valor_constr: number;
  fecha_adquisicion: string;
}

// Un "movimiento" explica cómo se llegó a cada número del resultado.
export interface MovimientoISR {
  paso: number;
  titulo: string;
  detalle: string;
  monto: number | null;
  categoria: 'referencia' | 'entrada' | 'ajuste' | 'resultado';
}

// Tipos para la salida/resultado
export interface ResultadoISR {
  base_gravable: number;
  isr_a_pagar: number;
  udi_usada: number;
  factor_ajuste: number;
  inpc_ratio: number;
  movimientos: MovimientoISR[];
}

// Configuración ISR (puede ser ajustada vía panel admin o base de datos)
const CONFIG_ISR = {
  limite_inferior: 1800000,
  porcentaje_excedente: 0.3,
  cuota_fija: 518000,
};

const UDI_REFERENCIA = 35.85;

export async function procesarCotizacion(
  datos: CotizacionDatos,
  inpcVenta: number,
  inpcAdquisicion: number
): Promise<ResultadoISR> {
  const {
    fecha_venta,
    valor_escritura,
    porcentaje_enajenante,
    exenta,
    valor_terreno,
    valor_constr,
    fecha_adquisicion,
  } = datos;

  const movimientos: MovimientoISR[] = [];
  const porcientoEnajenante = porcentaje_enajenante / 100;

  // Paso 1: UDI de referencia
  movimientos.push({
    paso: 1,
    titulo: 'Valor UDI (referencia)',
    detalle: 'UDI representativa usada por el método. En producción se obtendría de Banxico.',
    monto: UDI_REFERENCIA,
    categoria: 'referencia',
  });

  // Paso 2: Base del concepto (exento o general)
  let baseCalculada: number;
  let tituloBase: string;
  let detalleBase: string;

  if (exenta) {
    baseCalculada = 700000 * UDI_REFERENCIA * porcientoEnajenante;
    tituloBase = 'Monto exento (concepto base)';
    detalleBase = `700,000 × UDI (${UDI_REFERENCIA}) × % enajenante (${porcentaje_enajenante})`;
  } else {
    baseCalculada = valor_escritura * porcientoEnajenante;
    tituloBase = 'Valor de la operación (concepto base)';
    detalleBase = `Valor de escrituración (${valor_escritura}) × % enajenante (${porcentaje_enajenante})`;
  }

  movimientos.push({
    paso: 2,
    titulo: tituloBase,
    detalle: detalleBase,
    monto: baseCalculada,
    categoria: 'entrada',
  });

  // Paso 3: Factor de ajuste por años de tenencia sobre la construcción
  const anioVenta = new Date(fecha_venta).getFullYear();
  const anioAdquisicion = new Date(fecha_adquisicion).getFullYear();
  const anosTenencia = anioVenta - anioAdquisicion;
  const factorAjuste = anosTenencia > 0 ? Math.pow(0.95, anosTenencia) : 1;
  const valorConstruccionAjustado = valor_constr * factorAjuste;

  movimientos.push({
    paso: 3,
    titulo: `Años de tenencia: ${anosTenencia}`,
    detalle: `Factor de ajuste = 0.95^${anosTenencia} = ${factorAjuste.toFixed(6)}`,
    monto: factorAjuste,
    categoria: 'ajuste',
  });

  movimientos.push({
    paso: 3,
    titulo: 'Valor de construcción ajustado',
    detalle: `Valor de construcción (${valor_constr}) × factor (${factorAjuste.toFixed(6)})`,
    monto: valorConstruccionAjustado,
    categoria: 'ajuste',
  });

  // Paso 4: Ratio INPC y valor presente
  const inpcRatio = inpcVenta / inpcAdquisicion;
  const valorPresente = (valor_terreno + valorConstruccionAjustado) / inpcRatio;

  movimientos.push({
    paso: 4,
    titulo: 'Ratio INPC (venta / adquisición)',
    detalle: `${inpcVenta} / ${inpcAdquisicion}`,
    monto: inpcRatio,
    categoria: 'ajuste',
  });

  movimientos.push({
    paso: 4,
    titulo: 'Valor presente del inmueble',
    detalle: `(Terreno ${valor_terreno} + Construcción ajustada ${valorConstruccionAjustado}) / Ratio (${inpcRatio.toFixed(6)})`,
    monto: valorPresente,
    categoria: 'ajuste',
  });

  // Paso 5: Base gravable = base del concepto − valor presente
  const baseGravable = Math.max(0, baseCalculada - valorPresente);

  movimientos.push({
    paso: 5,
    titulo: 'Base gravable',
    detalle: `Concepto base (${baseCalculada}) − Valor presente (${valorPresente}). Mínimo 0.`,
    monto: baseGravable,
    categoria: 'resultado',
  });

  // Paso 6: Tabla de ISR
  let isrAPagar = 0;

  if (baseGravable > CONFIG_ISR.limite_inferior) {
    const excedente = baseGravable - CONFIG_ISR.limite_inferior;

    movimientos.push({
      paso: 6,
      titulo: 'Excedente sobre límite inferior',
      detalle: `Base gravable (${baseGravable}) − Límite inferior (${CONFIG_ISR.limite_inferior})`,
      monto: excedente,
      categoria: 'entrada',
    });

    isrAPagar = excedente * CONFIG_ISR.porcentaje_excedente + CONFIG_ISR.cuota_fija;

    movimientos.push({
      paso: 6,
      titulo: 'ISR a pagar',
      detalle: `Excedente (${excedente}) × ${CONFIG_ISR.porcentaje_excedente} + Cuota fija (${CONFIG_ISR.cuota_fija})`,
      monto: isrAPagar,
      categoria: 'resultado',
    });
  } else {
    movimientos.push({
      paso: 6,
      titulo: 'Base menor o igual al límite inferior',
      detalle: `Base gravable (${baseGravable}) ≤ Límite inferior (${CONFIG_ISR.limite_inferior}). No aplica la tabla de ISR.`,
      monto: null,
      categoria: 'entrada',
    });

    movimientos.push({
      paso: 6,
      titulo: 'ISR a pagar',
      detalle: 'Sin excedente sobre el límite inferior, el ISR es $0.',
      monto: 0,
      categoria: 'resultado',
    });
  }

  return {
    base_gravable: baseGravable,
    isr_a_pagar: isrAPagar,
    udi_usada: UDI_REFERENCIA,
    factor_ajuste: factorAjuste,
    inpc_ratio: inpcRatio,
    movimientos,
  };
}

export async function obtenerUDIActual(): Promise<{ valor_udi: number; fecha: string }> {
  // En producción haría fetch a la API de Banxico
  // Por ahora retorno valor representativo
  return { valor_udi: UDI_REFERENCIA, fecha: new Date().toISOString().split('T')[0] };
}

export async function obtenerINPC(_fecha: string): Promise<number> {
  // En producción haría fetch a la API de Banxico por fecha histórica
  // Por ahora retorno valores representativos 2024
  return 125.5; // INPC representativo 2024
}