'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ResultadoISR {
  base_gravable: number;
  isr_a_pagar: number;
  udi_usada: number;
  factor_ajuste: number;
  inpc_ratio: number;
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
      'Puedes asociar la cotización a un cliente guardado en tu dashboard para llevar el historial por cliente. Si aún no tienes clientes registrados, deja "Sin cliente asociado" y continúa; la cotización igual quedará en tu historial.',
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

  const pasoActual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  useEffect(() => {
    async function cargarClientes() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login?redirect=%2Fquoter');
        return;
      }

      const { data, error: errorClientes } = await supabase
        .from('clients')
        .select('id, nombre, email, telefono, rfc')
        .eq('user_id', user.id)
        .order('nombre');

      if (!errorClientes) setClientes(data || []);
      setCargandoClientes(false);
    }

    cargarClientes();
  }, [router]);

  const actualizar = (campo: keyof Formulario, valor: string | boolean) => {
    setForm((previo) => ({ ...previo, [campo]: valor }));
  };

  async function enviar() {
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const respuesta = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await respuesta.json();

      if (!respuesta.ok) {
        setError(payload.error ?? 'No fue posible realizar el cálculo');
        return;
      }

      setResultado(payload.resultado as ResultadoISR);
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

  function siguiente() {
    setError(null);
    if (!validarPasoActual()) {
      setError('Este campo es obligatorio para continuar.');
      return;
    }
    if (esUltimo) {
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
    setPaso(0);
    setDetalleAbierto(false);
  }

  const progreso = ((paso + 1) / PASOS.length) * 100;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; Volver al inicio
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Cotizador ISR por enajenación</h1>
        <p className="mt-2 text-sm opacity-70">
          Responde un dato por paso. Los valores de UDI e INPC son de referencia.
        </p>

        {resultado ? (
          <section className="mt-8 rounded-lg border border-black/10 p-6 dark:border-white/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Resultado de la cotización</h2>
                <p className="mt-1 text-sm opacity-70">
                  Guardada en tu historial del dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={nuevaCotizacion}
                className="rounded border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
              >
                Nueva cotización
              </button>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-black/5 p-4 dark:bg-white/5">
                <dt className="text-sm opacity-70">Base gravable</dt>
                <dd className="text-lg font-medium">{moneda.format(resultado.base_gravable)}</dd>
              </div>
              <div className="rounded-lg bg-blue-600/10 p-4">
                <dt className="text-sm text-blue-700 opacity-80 dark:text-blue-300">ISR a pagar</dt>
                <dd className="text-lg font-medium text-blue-600">
                  {moneda.format(resultado.isr_a_pagar)}
                </dd>
              </div>
              <div>
                <dt className="text-sm opacity-70">UDI utilizada</dt>
                <dd className="font-medium">{resultado.udi_usada.toFixed(4)}</dd>
              </div>
              <div>
                <dt className="text-sm opacity-70">Factor de ajuste</dt>
                <dd className="font-medium">{resultado.factor_ajuste.toFixed(6)}</dd>
              </div>
              <div>
                <dt className="text-sm opacity-70">Ratio INPC</dt>
                <dd className="font-medium">{resultado.inpc_ratio.toFixed(6)}</dd>
              </div>
            </dl>
          </section>
        ) : (
          <>
            <div className="mt-8">
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
              className="mt-6 rounded-lg border border-black/10 p-6 dark:border-white/15"
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
                {pasoActual.tipo === 'select' && (
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

            {error && (
              <p className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-between">
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
                  ? 'Calculando...'
                  : esUltimo
                    ? 'Calcular ISR'
                    : 'Siguiente'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}