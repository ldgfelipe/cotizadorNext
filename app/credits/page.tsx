'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Paquetes = Record<string, number>;

const ETIQUETAS: Record<string, string> = {
  basico: 'Básico',
  profesional: 'Profesional',
  enterprise: 'Enterprise',
};

const PRECIOS: Record<string, number> = {
  basico: 18,
  profesional: 35,
  enterprise: 80,
};

const moneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export default function CreditsPage() {
  const [paquetes, setPaquetes] = useState<Paquetes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [codigoCupon, setCodigoCupon] = useState('');
  const [canjeando, setCanjeando] = useState(false);
  const [creditosDisponibles, setCreditosDisponibles] = useState<number | null>(null);
  const [modo, setModo] = useState<'paypal' | 'simulacion' | null>(null);

  async function cargarSaldo() {
    const [{ data: compras }, { data: cotizaciones }] = await Promise.all([
      supabase.from('credit_purchases').select('credits').eq('status', 'completed'),
      supabase.from('quote_records').select('id'),
    ]);

    const comprados = compras?.reduce((suma, c) => suma + c.credits, 0) ?? 0;
    const usados = cotizaciones?.length ?? 0;
    setCreditosDisponibles(comprados - usados);
  }

  useEffect(() => {
    async function cargar() {
      const params = new URLSearchParams(window.location.search);

      if (params.get('exito') === '1') {
        const creditos = params.get('creditos');
        setMensaje(
          creditos
            ? `¡Pago aprobado! ${creditos} crédito(s) agregados a tu cuenta.`
            : '¡Pago aprobado! Créditos agregados a tu cuenta.'
        );
      } else if (params.get('cancelado') === '1') {
        setError('El pago fue cancelado.');
      } else if (params.get('error')) {
        setError('Ocurrió un problema con el pago. Intenta de nuevo.');
      }

      try {
        const [paquetesRes, comprasRes, cotizacionesRes] = await Promise.all([
          fetch('/api/paypal'),
          supabase.from('credit_purchases').select('credits').eq('status', 'completed'),
          supabase.from('quote_records').select('id'),
        ]);

        if (!paquetesRes.ok) throw new Error('sin respuesta');
        const paquetesData = await paquetesRes.json();
        setModo(paquetesData.modo ?? 'simulacion');
        setPaquetes(paquetesData);

        const comprados = comprasRes.data?.reduce((suma, c) => suma + c.credits, 0) ?? 0;
        const usados = cotizacionesRes.data?.length ?? 0;
        setCreditosDisponibles(comprados - usados);
      } catch {
        setError('No fue posible cargar los paquetes de créditos');
      }
    }

    cargar();
  }, []);

  async function comprar(paquete: string) {
    setProcesando(paquete);
    setError(null);
    setMensaje(null);

    try {
      const respuesta = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paquete, monto: PRECIOS[paquete] ?? 0 }),
      });

      const payload = await respuesta.json();

      if (!respuesta.ok) {
        setError(payload.error ?? 'No fue posible procesar el pago');
        return;
      }

      if (payload.modo === 'paypal') {
        if (payload.aprobacion) {
          window.location.assign(payload.aprobacion);
          return;
        }
        setError('No fue posible obtener la liga de pago de PayPal.');
        return;
      }

      setMensaje(
        `Pago simulado exitoso. Orden: ${payload.ordenId}. Créditos agregados: ${payload.creditosAgregados}`
      );
      await cargarSaldo();
    } catch {
      setError('Error de conexión al procesar el pago');
    } finally {
      setProcesando(null);
    }
  }

  async function canjearCupon() {
    const codigo = codigoCupon.trim();
    if (!codigo) {
      setError('Escribe el código del cupón.');
      return;
    }

    setCanjeando(true);
    setError(null);
    setMensaje(null);

    const { data, error: errorRpc } = await supabase.rpc('canjear_cupon', {
      codigo,
    });

    if (errorRpc) {
      setError(errorRpc.message);
    } else {
      setMensaje(`Cupón canjeado: ${data} crédito(s) agregados a tu cuenta.`);
      setCodigoCupon('');
      await cargarSaldo();
    }

    setCanjeando(false);
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; Volver al inicio
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Créditos</h1>
            <p className="mt-2 text-sm opacity-70">
              {modo === 'paypal'
                ? 'Compra cotizaciones con PayPal o canjea un cupón.'
                : 'Compra cotizaciones o canjea un cupón. El pago está en modo simulación; se activa PayPal real al configurar las credenciales.'}
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

        {error && (
          <p className="mt-6 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}

        {mensaje && (
          <p className="mt-6 rounded border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {mensaje}
          </p>
        )}

        <section className="mt-8 rounded-lg border border-black/10 p-6 dark:border-white/15">
          <h2 className="text-lg font-semibold">Canjear cupón</h2>
          <p className="mt-1 text-sm opacity-70">
            Si tienes un código de cupón, ingrésalo para sumar créditos a tu cuenta.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={codigoCupon}
              onChange={(e) => setCodigoCupon(e.target.value)}
              placeholder="Código del cupón"
              className="w-full rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
            <button
              type="button"
              onClick={canjearCupon}
              disabled={canjeando}
              className="rounded bg-green-600 px-5 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
            >
              {canjeando ? 'Canjeando...' : 'Canjear'}
            </button>
          </div>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {paquetes
            ? Object.entries(paquetes).map(([clave, creditos]) => (
                <article
                  key={clave}
                  className="flex flex-col rounded-lg border border-black/10 p-6 dark:border-white/15"
                >
                  <h2 className="text-lg font-semibold">{ETIQUETAS[clave] ?? clave}</h2>
                  <p className="mt-1 text-sm opacity-70">{creditos} cotizaciones</p>
                  <p className="mt-4 text-2xl font-bold">
                    {moneda.format(PRECIOS[clave] ?? 0)}
                  </p>
                  <button
                    type="button"
                    onClick={() => comprar(clave)}
                    disabled={procesando !== null}
                    className="mt-6 rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    {procesando === clave ? 'Procesando...' : 'Comprar'}
                  </button>
                </article>
              ))
            : !error && <p className="opacity-70">Cargando paquetes...</p>}
        </div>
      </div>
    </main>
  );
}