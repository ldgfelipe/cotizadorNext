'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    async function cargar() {
      try {
        const respuesta = await fetch('/api/paypal');
        if (!respuesta.ok) throw new Error('sin respuesta');
        setPaquetes(await respuesta.json());
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
      const respuesta = await fetch('/api/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paquete, monto: PRECIOS[paquete] ?? 0 }),
      });

      const payload = await respuesta.json();

      if (!respuesta.ok) {
        setError(payload.error ?? 'No fue posible procesar el pago');
        return;
      }

      setMensaje(`Pago simulado exitoso. Orden: ${payload.ordenId}. Créditos agregados: ${payload.creditosAgregados}`);
    } catch {
      setError('Error de conexión al procesar el pago');
    } finally {
      setProcesando(null);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; Volver al inicio
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Créditos</h1>
        <p className="mt-2 text-sm opacity-70">
          Compra cotizaciones con PayPal. El pago está en modo simulación hasta conectar
          las credenciales y el webhook de PayPal.
        </p>

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
