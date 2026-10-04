'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MovimientoISR {
  paso: number;
  titulo: string;
  detalle: string;
  monto: number | null;
  categoria: 'referencia' | 'entrada' | 'ajuste' | 'resultado';
}

interface ResultadoISR {
  base_gravable: number;
  isr_a_pagar: number;
  udi_usada: number;
  factor_ajuste: number;
  inpc_ratio: number;
  inpc_venta: number;
  inpc_adquisicion: number;
  anos_tenencia: number;
  valor_construccion_ajustado: number;
  valor_presente: number;
  movimientos: MovimientoISR[];
}

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  rfc?: string;
}

interface Formulario {
  fecha_venta: string;
  fecha_adquisicion: string;
  valor_escritura: string;
  porcentaje_enajenante: string;
  valor_terreno: string;
  valor_constr: string;
  exenta: boolean;
  client_id: string;
}

interface Paso {
  campo: keyof Formulario;
  tipo: 'select' | 'date' | 'number' | 'checkbox';
  titulo: string;
  basica: string;
  completa: string;
  requerido: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

const ESTADO_INICIAL: Formulario = {
  fecha_venta: '',
  fecha_adquisicion: '',
  valor_escritura: '',
  porcentaje_enajenante: '100',
  valor_terreno: '',
  valor_constr: '',
  exenta: false,
  client_id: '',
};

const PASOS: Paso[] = [
  {
    campo: 'client_id',
    tipo: 'select',
    titulo: 'Cliente',
    basica: '¿A nombre de quién será la cotización?',
    completa:
      'Puedes asociar la cotización a un cliente existente o crear uno nuevo al vuelo. Los clientes quedan guardados y los verás en la sección "Mis clientes" de tu dashboard.',
    requerido: false,
  },
  {
    campo: 'fecha_venta',
    tipo: 'date',
    titulo: 'Fecha de venta',
    basica: '¿En qué fecha se enajena (vende) el inmueble?',
    completa:
      'Es el día en que se firma la venta. Con esta fecha ubicamos el Índice Nacional de Precios al Consumidor (INPC) del mes de venta, que junto con el de la adquisición determina el ajuste por inflación de la ganancia.',
    requerido: true,
  },
  {
    campo: 'fecha_adquisicion',
    tipo: 'date',
    titulo: 'Fecha de adquisición',
    basica: '¿Cuándo adquiriste el inmueble?',
    completa:
      'Es la fecha original de compra. Entre esta y la fecha de venta se calcula el factor de ajuste por inflación (INPC de venta / INPC de adquisición), que actualiza el costo del inmueble y permite tributar solo por la ganancia real.',
    requerido: true,
  },
  {
    campo: 'valor_escritura',
    tipo: 'number',
    titulo: 'Valor de escrituración',
    basica: '¿Cuál es el valor de la operación según la escritura o contrato?',
    completa:
      'Importe total de la compra-venta en pesos mexicanos. Sirve como referencia para validar la división entre terreno y construcción. Este monto se ajusta por inflación al momento del cálculo.',
    requerido: true,
    min: 0,
    step: 0.01,
    placeholder: 'Ej. 2500000',
  },
  {
    campo: 'porcentaje_enajenante',
    tipo: 'number',
    titulo: 'Porcentaje de enajenante',
    basica: '¿Qué porcentaje del inmueble estás transfiriendo?',
    completa:
      'Si vendes la totalidad, indica 100. Si vendes una parte o varios copropietarios enajenan su porción, escribe el porcentaje correspondiente; la base gravable se prorratea en esa proporción.',
    requerido: true,
    min: 0.01,
    max: 100,
    step: 0.01,
  },
  {
    campo: 'valor_terreno',
    tipo: 'number',
    titulo: 'Valor del terreno',
    basica: '¿Cuánto vale el terreno dentro del valor total?',
    completa:
      'La ley separa el terreno de la construcción porque tienen tratamientos distintos. El valor del terreno más el de la construcción debe ser igual (o menor, en ausencia de datos) al valor de escrituración. Usa el avalúo catastral o comercial para la repartición.',
    requerido: true,
    min: 0,
    step: 0.01,
    placeholder: 'Ej. 1000000',
  },
  {
    campo: 'valor_constr',
    tipo: 'number',
    titulo: 'Valor de construcción',
    basica: '¿Cuánto vale la construcción dentro del valor total?',
    completa:
      'Es la parte del valor atribuible a la construcción (casa, departamento, edificio). Utilízala junto con el valor del terreno; si no tienes la descomposición exacta, apóyate en el avalúo o en los recibos del impuesto predial.',
    requerido: true,
    min: 0,
    step: 0.01,
    placeholder: 'Ej. 1500000',
  },
  {
    campo: 'exenta',
    tipo: 'checkbox',
    titulo: 'Operación exenta',
    basica: '¿La venta es de una vivienda exenta de ISR?',
    completa:
      'Existen supuestos de enajenación de casa habitación exentos de ISR (por ejemplo, la casa habitación del contribuyente, según la LISR). Si tu caso califica, actívala y el sistema lo considerará en el cálculo; si no estás seguro, déjala desactivada y consulta a un contador.',
    requerido: false,
  },
];

const moneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

const numero = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 6 });

const escapar = (valor: string) =>
  valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export default function QuoterPage() {
  const router = useRouter();

  const [form, setForm] = useState<Formulario>(ESTADO_INICIAL);
  const [resultado, setResultado] = useState<ResultadoISR | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [paso, setPaso] = useState(0);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [modoCliente, setModoCliente] = useState<'seleccionar' | 'crear'>('seleccionar');
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');
  const [nuevoClienteEmail, setNuevoClienteEmail] = useState('');
  const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState('');
  const [creditosDisponibles, setCreditosDisponibles] = useState<number | null>(null);
  const [sinCreditos, setSinCreditos] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const pasoActual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;
  const clienteSeleccionado = clientes.find((c) => c.id === form.client_id);

  useEffect(() => {
    async function cargarDatosIniciales() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login?redirect=%2Fquoter');
        return;
      }

      setUserId(user.id);

      const [clientesRes, comprasRes, cotizacionesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, nombre, email, telefono, rfc')
          .eq('user_id', user.id)
          .order('nombre'),
        supabase.from('credit_purchases').select('credits').eq('status', 'completed'),
        supabase.from('quote_records').select('id'),
      ]);

      setClientes(clientesRes.data ?? []);
      setCargandoClientes(false);

      const comprados =
        comprasRes.data?.reduce((suma, c) => suma + c.credits, 0) ?? 0;
      const usados = cotizacionesRes.data?.length ?? 0;
      setCreditosDisponibles(comprados - usados);
    }

    cargarDatosIniciales();
  }, [router]);

  const actualizar = (campo: keyof Formulario, valor: string | boolean) => {
    setForm((previo) => ({ ...previo, [campo]: valor }));
  };

  async function enviar() {
    setCargando(true);
    setError(null);
    setResultado(null);
    setSinCreditos(false);
    setAviso(null);

    try {
      const respuesta = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await respuesta.json();

      if (!respuesta.ok) {
        if (payload.codigo === 'SIN_CREDITOS') {
          setSinCreditos(true);
        }
        setError(payload.error ?? 'No fue posible realizar el cálculo');
        return;
      }

      setResultado(payload.resultado as ResultadoISR);
      if (payload.aviso) setAviso(payload.aviso);
    } catch {
      setError('Error de conexión al solicitar el cálculo');
    } finally {
      setCargando(false);
    }
  }

  function validarPasoActual(): boolean {
    if (!pasoActual.requerido) return true;
    const valor = form[pasoActual.campo];
    return typeof valor === 'string' && valor.trim() !== '';
  }

  async function siguiente() {
    setError(null);

    if (paso === 0 && modoCliente === 'crear') {
      const nombre = nuevoClienteNombre.trim();
      if (!nombre) {
        setError('El nombre del cliente es obligatorio.');
        return;
      }
      if (!userId) {
        setError('Debes iniciar sesión.');
        return;
      }

      setCargando(true);
      const { data, error: errorCliente } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          nombre,
          email: nuevoClienteEmail.trim() || null,
          telefono: nuevoClienteTelefono.trim() || null,
        })
        .select('id, nombre, email, telefono, rfc')
        .single();
      setCargando(false);

      if (errorCliente || !data) {
        setError(errorCliente?.message ?? 'No fue posible crear el cliente');
        return;
      }

      setClientes((previo) => [data, ...previo]);
      actualizar('client_id', data.id);
      setModoCliente('seleccionar');
      setNuevoClienteNombre('');
      setNuevoClienteEmail('');
      setNuevoClienteTelefono('');
      setPaso(1);
      setDetalleAbierto(false);
      return;
    }

    if (!validarPasoActual()) {
      setError('Este campo es obligatorio para continuar.');
      return;
    }

    if (esUltimo) {
      if (creditosDisponibles !== null && creditosDisponibles < 1) {
        setSinCreditos(true);
        return;
      }
      enviar();
      return;
    }

    setPaso((p) => p + 1);
    setDetalleAbierto(false);
  }

  function atras() {
    setError(null);
    setPaso((p) => Math.max(0, p - 1));
    setDetalleAbierto(false);
  }

  function nuevaCotizacion() {
    setForm(ESTADO_INICIAL);
    setResultado(null);
    setError(null);
    setSinCreditos(false);
    setAviso(null);
    setPaso(0);
    setDetalleAbierto(false);
  }

  function imprimir() {
    window.print();
  }

  function generarHtmlCotizacion(): string {
    const linea = (etiqueta: string, valor: string) =>
      `<div class="campo"><span class="etiqueta">${etiqueta}</span><span class="valor">${valor}</span></div>`;

    const movimientosHtml = (resultado?.movimientos ?? [])
      .map(
        (m) => `<tr>
          <td class="paso">${m.paso}</td>
          <td><strong>${escapar(m.titulo)}</strong></td>
          <td class="detalle">${escapar(m.detalle)}</td>
          <td class="monto">${m.monto === null ? '—' : escapeMonto(m.monto)}</td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Cotización ISR</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 24px; line-height: 1.4; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .subtitulo { color: #555; font-size: 13px; margin-bottom: 12px; }
  h2 { font-size: 15px; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .campo { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-bottom: 1px dotted #eee; font-size: 13px; }
  .etiqueta { color: #555; }
  .valor { font-weight: 600; text-align: right; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 8px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f2f6ff; }
  td.monto, td.paso { text-align: right; white-space: nowrap; }
  .total { background: #eaf3ff; font-weight: 700; }
  .footer { margin-top: 24px; font-size: 11px; color: #777; }
</style>
</head>
<body>
  <h1>Cotización ISR por enajenación de inmueble</h1>
  <div class="subtitulo">Generada el ${new Date().toLocaleString('es-MX')}</div>

  <div class="campo"><span class="etiqueta">Cliente</span><span class="valor">${escapar(clienteSeleccionado?.nombre ?? 'Sin cliente asociado')}</span></div>
  ${clienteSeleccionado?.email ? linea('Correo', escapar(clienteSeleccionado.email)) : ''}
  ${clienteSeleccionado?.telefono ? linea('Teléfono', escapar(clienteSeleccionado.telefono)) : ''}
  ${clienteSeleccionado?.rfc ? linea('RFC', escapar(clienteSeleccionado.rfc)) : ''}

  <h2>Datos de la operación</h2>
  ${linea('Fecha de venta', form.fecha_venta)}
  ${linea('Fecha de adquisición', form.fecha_adquisicion)}
  ${linea('Años de tenencia', String(resultado?.anos_tenencia ?? 0))}
  ${linea('Valor de escrituración', moneda.format(Number(form.valor_escritura) || 0))}
  ${linea('Porcentaje de enajenante', `${form.porcentaje_enajenante}%`)}
  ${linea('Valor del terreno', moneda.format(Number(form.valor_terreno) || 0))}
  ${linea('Valor de construcción', moneda.format(Number(form.valor_constr) || 0))}
  ${linea('Operación exenta', form.exenta ? 'Sí' : 'No')}
  ${linea('INPC de venta', String(resultado?.inpc_venta ?? 0))}
  ${linea('INPC de adquisición', String(resultado?.inpc_adquisicion ?? 0))}
  ${linea('Valor UDI (referencia)', String(resultado?.udi_usada ?? 0))}
  ${linea('Valor de construcción ajustado', moneda.format(resultado?.valor_construccion_ajustado ?? 0))}
  ${linea('Valor presente del inmueble', moneda.format(resultado?.valor_presente ?? 0))}

  <h2>Movimientos del cálculo</h2>
  <table>
    <thead><tr><th>Paso</th><th>Concepto</th><th>Detalle</th><th>Valor</th></tr></thead>
    <tbody>${movimientosHtml}</tbody>
  </table>

  <h2>Resultado</h2>
  ${linea('Base gravable', moneda.format(resultado?.base_gravable ?? 0))}
  ${linea('ISR a pagar', moneda.format(resultado?.isr_a_pagar ?? 0))}
  ${linea('UDI utilizada', String(resultado?.udi_usada ?? 0))}
  ${linea('Factor de ajuste', String(resultado?.factor_ajuste ?? 0))}
  ${linea('Ratio INPC', String(resultado?.inpc_ratio ?? 0))}

  <div class="footer">Este documento es una estimación generada por el sistema y no constituye asesoría fiscal.</div>
</body>
</html>`;
  }

  function escapeMonto(monto: number): string {
    return numero.format(monto);
  }

  function descargarCotizacion() {
    const html = generarHtmlCotizacion();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `cotizacion-${form.fecha_venta || 'sin-fecha'}.html`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  const progreso = ((paso + 1) / PASOS.length) * 100;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 no-print">
          &larr; Volver al inicio
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Cotizador ISR por enajenación</h1>
            <p className="mt-1 text-sm opacity-70">
              Responde un dato por paso. Los valores de UDI e INPC son de referencia.
            </p>
          </div>
          <div
            className={
              'rounded-full border px-3 py-1 text-sm font-semibold ' +
              (creditosDisponibles !== null && creditosDisponibles < 1
                ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400')
            }
          >
            {creditosDisponibles === null
              ? 'Créditos: ...'
              : `Créditos disponibles: ${creditosDisponibles}`}
          </div>
        </div>

        {resultado ? (
          <section
            id="area-imprimible"
            className="mt-8 rounded-lg border border-black/10 p-6 print-area dark:border-white/15"
          >
            {aviso && (
              <div className="no-print mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                {aviso}
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold">Resultado de la cotización</h2>
              <p className="mt-1 text-sm opacity-70">
                Cliente: {clienteSeleccionado?.nombre ?? 'Sin cliente asociado'} ·
                {new Date().toLocaleString('es-MX')}
              </p>
            </div>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide opacity-70">
              Datos del cliente
            </h3>
            <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Nombre</dt>
                <dd className="font-semibold">
                  {clienteSeleccionado?.nombre ?? 'Sin cliente asociado'}
                </dd>
              </div>
              {clienteSeleccionado?.email && (
                <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                  <dt className="opacity-70">Correo</dt>
                  <dd className="font-semibold">{clienteSeleccionado.email}</dd>
                </div>
              )}
              {clienteSeleccionado?.telefono && (
                <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                  <dt className="opacity-70">Teléfono</dt>
                  <dd className="font-semibold">{clienteSeleccionado.telefono}</dd>
                </div>
              )}
              {clienteSeleccionado?.rfc && (
                <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                  <dt className="opacity-70">RFC</dt>
                  <dd className="font-semibold">{clienteSeleccionado.rfc}</dd>
                </div>
              )}
            </dl>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide opacity-70">
              Datos de la operación
            </h3>
            <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Fecha de venta</dt>
                <dd className="font-semibold">{form.fecha_venta}</dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Fecha de adquisición</dt>
                <dd className="font-semibold">{form.fecha_adquisicion}</dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Años de tenencia</dt>
                <dd className="font-semibold">{resultado.anos_tenencia}</dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Valor de escrituración</dt>
                <dd className="font-semibold">
                  {moneda.format(Number(form.valor_escritura) || 0)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Porcentaje de enajenante</dt>
                <dd className="font-semibold">{form.porcentaje_enajenante}%</dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Valor del terreno</dt>
                <dd className="font-semibold">
                  {moneda.format(Number(form.valor_terreno) || 0)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Valor de construcción</dt>
                <dd className="font-semibold">
                  {moneda.format(Number(form.valor_constr) || 0)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Operación exenta</dt>
                <dd className="font-semibold">{form.exenta ? 'Sí' : 'No'}</dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">INPC de venta</dt>
                <dd className="font-semibold">{resultado.inpc_venta}</dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">INPC de adquisición</dt>
                <dd className="font-semibold">{resultado.inpc_adquisicion}</dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Valor UDI (referencia)</dt>
                <dd className="font-semibold">{resultado.udi_usada}</dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <dt className="opacity-70">Valor de construcción ajustado</dt>
                <dd className="font-semibold">
                  {moneda.format(resultado.valor_construccion_ajustado)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1 dark:border-white/10 sm:col-span-2">
                <dt className="opacity-70">Valor presente del inmueble</dt>
                <dd className="font-semibold">{moneda.format(resultado.valor_presente)}</dd>
              </div>
            </dl>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide opacity-70">
              Movimientos del cálculo
            </h3>
            <div className="mt-2 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="p-2 text-left">Paso</th>
                    <th className="p-2 text-left">Concepto</th>
                    <th className="p-2 text-left">Detalle</th>
                    <th className="p-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {(resultado.movimientos ?? []).map((m, i) => (
                    <tr key={i} className="border-b border-black/5 dark:border-white/10">
                      <td className="p-2 text-right">{m.paso}</td>
                      <td className="p-2 font-medium">{m.titulo}</td>
                      <td className="p-2 opacity-80">{m.detalle}</td>
                      <td className="p-2 text-right font-semibold">
                        {m.monto === null ? '—' : numero.format(m.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-black/5 p-4 dark:bg-white/5">
                <p className="text-sm opacity-70">Base gravable</p>
                <p className="text-lg font-medium">{moneda.format(resultado.base_gravable)}</p>
              </div>
              <div className="rounded-lg bg-blue-600/10 p-4">
                <p className="text-sm text-blue-700 opacity-80 dark:text-blue-300">ISR a pagar</p>
                <p className="text-lg font-medium text-blue-600">
                  {moneda.format(resultado.isr_a_pagar)}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-70">UDI utilizada</p>
                <p className="font-medium">{resultado.udi_usada.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Factor de ajuste</p>
                <p className="font-medium">{resultado.factor_ajuste.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Ratio INPC</p>
                <p className="font-medium">{resultado.inpc_ratio.toFixed(6)}</p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="no-print mt-8">
              <div className="flex items-center justify-between text-sm opacity-70">
                <span>
                  Paso {paso + 1} de {PASOS.length}
                </span>
                <span>{progreso.toFixed(0)}% completado</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progreso}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between">
                {PASOS.map((p, i) => (
                  <button
                    key={p.campo}
                    type="button"
                    disabled={i > paso}
                    onClick={() => {
                      if (i < paso) {
                        setPaso(i);
                        setDetalleAbierto(false);
                        setError(null);
                      }
                    }}
                    aria-label={p.titulo}
                    className={
                      'grid size-7 place-items-center rounded-full text-xs font-semibold transition-colors ' +
                      (i === paso
                        ? 'bg-blue-600 text-white'
                        : i < paso
                          ? 'bg-blue-600/20 text-blue-700 dark:text-blue-300'
                          : 'bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40')
                    }
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <section
              key={pasoActual.campo}
              className="mt-6 rounded-lg border border-black/10 p-6 no-print dark:border-white/15"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{pasoActual.titulo}</h2>
                  <p className="mt-1 text-sm opacity-80">{pasoActual.basica}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetalleAbierto((previo) => !previo)}
                  aria-label="Ver descripción completa"
                  title="¿Qué significa esto?"
                  className={
                    'grid size-9 shrink-0 place-items-center rounded-full border text-lg font-bold transition-colors ' +
                    (detalleAbierto
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-black/20 hover:border-blue-600 hover:text-blue-600 dark:border-white/25')
                  }
                >
                  ?
                </button>
              </div>

              {detalleAbierto && (
                <div className="mt-4 rounded-lg border border-blue-600/30 bg-blue-600/5 p-4 text-sm dark:border-blue-400/30 dark:bg-blue-400/5">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    Descripción completa:{' '}
                  </span>
                  {pasoActual.completa}
                </div>
              )}

              <div className="mt-6">
                {pasoActual.campo === 'client_id' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setModoCliente('seleccionar')}
                        className={
                          'rounded px-3 py-1.5 text-sm font-medium transition-colors ' +
                          (modoCliente === 'seleccionar'
                            ? 'bg-blue-600 text-white'
                            : 'border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5')
                        }
                      >
                        Seleccionar cliente
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoCliente('crear')}
                        className={
                          'rounded px-3 py-1.5 text-sm font-medium transition-colors ' +
                          (modoCliente === 'crear'
                            ? 'bg-blue-600 text-white'
                            : 'border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5')
                        }
                      >
                        Crear cliente
                      </button>
                    </div>

                    {modoCliente === 'seleccionar' ? (
                      <select
                        value={form.client_id}
                        onChange={(e) => actualizar('client_id', e.target.value)}
                        className="w-full rounded border border-black/15 px-3 py-2.5 dark:border-white/20 dark:bg-transparent"
                      >
                        {cargandoClientes ? (
                          <option>Cargando clientes...</option>
                        ) : (
                          <>
                            <option value="">Sin cliente asociado</option>
                            {clientes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre} {c.email ? `(${c.email})` : ''}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    ) : (
                      <div className="grid gap-3">
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="font-medium">Nombre *</span>
                          <input
                            type="text"
                            value={nuevoClienteNombre}
                            onChange={(e) => setNuevoClienteNombre(e.target.value)}
                            placeholder="Nombre del cliente"
                            className="rounded border border-black/15 px-3 py-2.5 dark:border-white/20 dark:bg-transparent"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="font-medium">Correo</span>
                          <input
                            type="email"
                            value={nuevoClienteEmail}
                            onChange={(e) => setNuevoClienteEmail(e.target.value)}
                            placeholder="cliente@ejemplo.com"
                            className="rounded border border-black/15 px-3 py-2.5 dark:border-white/20 dark:bg-transparent"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="font-medium">Teléfono</span>
                          <input
                            type="tel"
                            value={nuevoClienteTelefono}
                            onChange={(e) => setNuevoClienteTelefono(e.target.value)}
                            placeholder="555 000 0000"
                            className="rounded border border-black/15 px-3 py-2.5 dark:border-white/20 dark:bg-transparent"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {pasoActual.tipo === 'date' && (
                  <input
                    type="date"
                    value={form[pasoActual.campo] as string}
                    onChange={(e) => actualizar(pasoActual.campo, e.target.value)}
                    className="w-full rounded border border-black/15 px-3 py-2.5 dark:border-white/20 dark:bg-transparent"
                  />
                )}

                {pasoActual.tipo === 'number' && (
                  <input
                    type="number"
                    min={pasoActual.min}
                    max={pasoActual.max}
                    step={pasoActual.step ?? 1}
                    placeholder={pasoActual.placeholder}
                    value={form[pasoActual.campo] as string}
                    onChange={(e) => actualizar(pasoActual.campo, e.target.value)}
                    className="w-full rounded border border-black/15 px-3 py-2.5 dark:border-white/20 dark:bg-transparent"
                  />
                )}

                {pasoActual.tipo === 'checkbox' && (
                  <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.exenta}
                      onChange={(e) => actualizar('exenta', e.target.checked)}
                      className="size-5"
                    />
                    <span className="font-medium">
                      Sí, la operación está exenta de ISR
                    </span>
                  </label>
                )}
              </div>
            </section>

            {sinCreditos && (
              <div className="mt-4 no-print rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 dark:border-amber-400/40 dark:bg-amber-400/10">
                <h3 className="font-semibold text-amber-700 dark:text-amber-300">
                  No tienes créditos disponibles
                </h3>
                <p className="mt-1 text-sm opacity-80">
                  Necesitas al menos 1 crédito para crear una cotización. Compra un paquete
                  o canjea un cupón en la sección de créditos.
                </p>
                <Link
                  href="/credits"
                  className="mt-4 inline-block rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                >
                  Ir a créditos
                </Link>
              </div>
            )}

            {error && !sinCreditos && (
              <p className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 no-print dark:text-red-400">
                {error}
              </p>
            )}

            <div className="no-print mt-6 flex justify-between">
              <button
                type="button"
                onClick={atras}
                disabled={paso === 0 || cargando}
                className="rounded border border-black/15 px-5 py-2 font-medium transition-colors hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/5"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={siguiente}
                disabled={cargando}
                className="rounded bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {cargando
                  ? 'Procesando...'
                  : esUltimo
                    ? 'Calcular ISR'
                    : 'Siguiente'}
              </button>
            </div>
          </>
        )}

        {resultado && (
          <div className="no-print mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={imprimir}
              className="rounded bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={descargarCotizacion}
              className="rounded border border-black/15 px-5 py-2 font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
            >
              Descargar cotización
            </button>
            <button
              type="button"
              onClick={nuevaCotizacion}
              className="rounded border border-black/15 px-5 py-2 font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
            >
              Nueva cotización
            </button>
          </div>
        )}
      </div>
    </main>
  );
}