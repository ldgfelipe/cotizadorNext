'use client';

import Link from 'next/link';
import { useState, type FormEvent, useEffect } from 'react';
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

const ESTADO_INICIAL = {
  fecha_venta: '',
  fecha_adquisicion: '',
  valor_escritura: '',
  porcentaje_enajenante: '100',
  valor_terreno: '',
  valor_constr: '',
  exenta: false,
  client_id: '',
};

const moneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

export default function QuoterPage() {
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [resultado, setResultado] = useState<ResultadoISR | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);

  useEffect(() => {
    async function cargarClientes() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('clients')
        .select('id, nombre, email, telefono, rfc')
        .eq('user_id', user.id)
        .order('nombre');
      if (!error) setClientes(data || []);
      setCargandoClientes(false);
    }
    cargarClientes();
  }, []);

  const actualizar = (campo: string, valor: string | boolean) => {
    setForm((previo) => ({ ...previo, [campo]: valor }));
  };

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
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

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; Volver al inicio
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Cotizador ISR por enajenación</h1>
        <p className="mt-2 text-sm opacity-70">
          Los valores de UDI e INPC son de referencia. Conéctalos con la API de Banxico
          para valores oficiales.
        </p>

        <form
          onSubmit={manejarEnvio}
          className="mt-8 grid gap-4 rounded-lg border border-black/10 p-6 md:grid-cols-2 dark:border-white/15"
        >
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium">Cliente (opcional)</span>
            {cargandoClientes ? (
              <select disabled className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent">
                <option>Cargando clientes...</option>
              </select>
            ) : (
              <select
                value={form.client_id}
                onChange={(e) => actualizar('client_id', e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              >
                <option value="">Sin cliente asociado</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Fecha de venta</span>
            <input
              type="date"
              required
              value={form.fecha_venta}
              onChange={(e) => actualizar('fecha_venta', e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Fecha de adquisición</span>
            <input
              type="date"
              required
              value={form.fecha_adquisicion}
              onChange={(e) => actualizar('fecha_adquisicion', e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Valor de escrituración</span>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.valor_escritura}
              onChange={(e) => actualizar('valor_escritura', e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Porcentaje de enajenante</span>
            <input
              type="number"
              required
              min="0"
              max="100"
              step="0.01"
              value={form.porcentaje_enajenante}
              onChange={(e) => actualizar('porcentaje_enajenante', e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Valor del terreno</span>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.valor_terreno}
              onChange={(e) => actualizar('valor_terreno', e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Valor de construcción</span>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.valor_constr}
              onChange={(e) => actualizar('valor_constr', e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
          </label>

          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.exenta}
              onChange={(e) => actualizar('exenta', e.target.checked)}
              className="size-4"
            />
            <span className="font-medium">Operación exenta</span>
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={cargando}
              className="rounded bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {cargando ? 'Calculando...' : 'Calcular ISR'}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-6 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}

        {resultado && (
          <section className="mt-6 rounded-lg border border-black/10 p-6 dark:border-white/15">
            <h2 className="text-xl font-semibold">Resultado</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm opacity-70">Base gravable</dt>
                <dd className="text-lg font-medium">{moneda.format(resultado.base_gravable)}</dd>
              </div>
              <div>
                <dt className="text-sm opacity-70">ISR a pagar</dt>
                <dd className="text-lg font-medium text-blue-600">{moneda.format(resultado.isr_a_pagar)}</dd>
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
        )}
      </div>
    </main>
  );
}