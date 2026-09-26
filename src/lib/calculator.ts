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

// Tipos para la salida/resultado
export interface ResultadoISR {
  base_gravable: number;
  isr_a_pagar: number;
  udi_usada: number;
  factor_ajuste: number;
  inpc_ratio: number;
}

// Configuración ISR (puede ser ajustada vía panel admin o base de datos)
const CONFIG_ISR = {
  limite_inferior: 1800000,
  porcentaje_excedente: 0.30,
  cuota_fija: 518000,
};

// CalculatorService - funciones server-side
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

  // Paso 1: Obtener UDI actual
  // NOTA: En producción esto llamaría a la API de Banxico
  // Por ahora usamos un valor fijo representativo
  const valorUDI = 35.85; // Valor UDI representativo

  // Paso 1 alternativo: Si es exenta, multiplicar: 700,000 * Valor_UDI * %Enajenante
  let baseCalculada = 0;
  if (exenta) {
    // Lógica exenta: 700,000 * Valor_UDI * %Enajenante
    baseCalculada = 700000 * valorUDI * porcentaje_enajenante / 100;
  } else {
    // Lógica general: valor de escrituración (o se podría calcular costo+terreno)
    baseCalculada = valor_escritura;
  }

  // Paso 2: Calcular el factor de ajuste por años (Costo de construcción * Factor tabla de ajuste)
  // Simplified: factor = (años > 0) ? pow(0.95, años) : 1
  const anos = new Date(fecha_venta).getFullYear() - new Date(fecha_adquisicion).getFullYear();
  const factorAjuste =anos > 0 ? Math.pow(0.95,anos) : 1;
  const valorConstruccionAjustado = valor_constr * factorAjuste;

  // Paso 3: Traer a valor presente dividiendo el INPC de la fecha de venta entre el INPC de la fecha de adquisición
  const inpcRatio = inpcVenta / inpcAdquisicion;
  
  // Valor presente = (valor_terreno + valor_constr_ajustado) / inpcRatio
  const valorPresente = (valor_terreno + valorConstruccionAjustado) / inpcRatio;

  // Paso 4: Restar deducciones y exenciones a la ganancia para obtener la base gravable
  const baseGravable = baseCalculada - valorPresente;

  // Paso 5: Aplicar tabla ISR
  let isrAPagar = 0;
  if (baseGravable > CONFIG_ISR.limite_inferior) {
    const excedente = baseGravable - CONFIG_ISR.limite_inferior;
    isrAPagar = (excedente * CONFIG_ISR.porcentaje_excedente) + CONFIG_ISR.cuota_fija;
  }

  return {
    base_gravable: Math.max(0, baseGravable),
    isr_a_pagar: isrAPagar,
    udi_usada: valorUDI,
    factor_ajuste: factorAjuste,
    inpc_ratio: inpcRatio,
  };
}

export async function obtenerUDIActual(): Promise<{ valor_udi: number; fecha: string }> {
  // En producción haría fetch a la API de Banxico
  // Por ahora retorno valor representativo
  return { valor_udi: 35.85, fecha: new Date().toISOString().split('T')[0] };
}

export async function obtenerINPC(fecha: string): Promise<number> {
  // En producción haría fetch a la API de Banxico por fecha histórica
  // Por ahora retorno valores representativos 2024
  return 125.50; // INPC representativo 2024
}