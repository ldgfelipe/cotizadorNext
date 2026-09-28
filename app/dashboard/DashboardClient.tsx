'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  rfc: string | null;
  direccion: string | null;
  notas: string | null;
  created_at: string;
}

interface Cotizacion {
  id: string;
  client_id: string | null;
  input_data: {
    fecha_venta?: string;
    fecha_adquisicion?: string;
    valor_escritura?: number;
  };
  result_data: { base_gravable?: number; isr_a_pagar?: number };
  created_at: string;
}

interface Compra {
  id: string;
  package: string;
  credits: number;
  amount: number;
  status: string;
  created_at: string;
}

const CAMPOS_VACIOS = {
  nombre: '',
  email: '',
  telefono: '',
  rfc: '',
  direccion: '',
  notas: '',
};

const moneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

const fecha = (valor: string) =>
  new Date(valor).toLocaleDateString('es-MX', { dateStyle: 'medium' });

interface DatosDashboard {
  clientes: Cliente[];
  cotizaciones: Cotizacion[];
  compras: Compra[];
  error: string | null;
}

async function obtenerDatos(): Promise<DatosDashboard> {
  const [clientesRes, cotizacionesRes, comprasRes] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('quote_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('credit_purchases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const fallo = clientesRes.error ?? cotizacionesRes.error ?? comprasRes.error;

  return {
    clientes: clientesRes.data ?? [],
    cotizaciones: cotizacionesRes.data ?? [],
    compras: comprasRes.data ?? [],
    error: fallo ? fallo.message : null,
  };
}

export default function DashboardClient({ email }: { email: string }) {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [form, setForm] = useState(CAMPOS_VACIOS);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const aplicarDatos = useCallback((datos: DatosDashboard) => {
    setClientes(datos.clientes);
    setCotizaciones(datos.cotizaciones);
    setCompras(datos.compras);
    if (datos.error) setError(datos.error);
    setCargando(false);
  }, []);

  const cargarDatos = useCallback(async () => {
    aplicarDatos(await obtenerDatos());
  }, [aplicarDatos]);

  useEffect(() => {
    let activo = true;

    obtenerDatos().then((datos) => {
      if (!activo) return;
      aplicarDatos(datos);
    });

    return () => {
      activo = false;
    };
  }, [aplicarDatos]);

  function actualizar(campo: keyof typeof CAMPOS_VACIOS, valor: string) {
    setForm((previo) => ({ ...previo, [campo]: valor }));
  }

  function reiniciarFormulario() {
    setForm(CAMPOS_VACIOS);
    setEditandoId(null);
  }

  function editar(cliente: Cliente) {
    setEditandoId(cliente.id);
    setForm({
      nombre: cliente.nombre,
      email: cliente.email ?? '',
      telefono: cliente.telefono ?? '',
      rfc: cliente.rfc ?? '',
      direccion: cliente.direccion ?? '',
      notas: cliente.notas ?? '',
    });
  }

  async function guardarCliente(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    setExito(null);

    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
      rfc: form.rfc.trim() || null,
      direccion: form.direccion.trim() || null,
      notas: form.notas.trim() || null,
    };

    const consulta = editandoId
      ? supabase.from('clients').update(payload).eq('id', editandoId)
      : supabase.from('clients').insert(payload);

    const { error: errorGuardado } = await consulta;

    if (errorGuardado) {
      setError(errorGuardado.message);
    } else {
      setExito(editandoId ? 'Cliente actualizado.' : 'Cliente creado.');
      reiniciarFormulario();
      await cargarDatos();
    }

    setGuardando(false);
  }

  async function eliminarCliente(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar a ${nombre}? Sus cotizaciones quedarán sin cliente.`)) {
      return;
    }

    setError(null);
    const { error: errorBorrado } = await supabase.from('clients').delete().eq('id', id);

    if (errorBorrado) {
      setError(errorBorrado.message);
      return;
    }

    setExito('Cliente eliminado.');
    await cargarDatos();
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const nombreDe = (clientId: string | null) =>
    clientes.find((c) => c.id === clientId)?.nombre ?? 'Sin cliente';

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm opacity-70">Sesión iniciada como {email}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/quoter"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Nueva cotización
            </Link>
            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded border border-black/15 px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {error && (
          <p className="mt-6 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
        {exito && (
          <p className="mt-6 rounded border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
            {exito}
          </p>
        )}

        <section className="mt-8 rounded-lg border border-black/10 p-6 dark:border-white/15">
          <h2 className="text-xl font-semibold">
            {editandoId ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>

          <form onSubmit={guardarCliente} className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Nombre *</span>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => actualizar('nombre', e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Correo</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => actualizar('email', e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Teléfono</span>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => actualizar('telefono', e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">RFC</span>
              <input
                type="text"
                value={form.rfc}
                onChange={(e) => actualizar('rfc', e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              <span className="font-medium">Dirección</span>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => actualizar('direccion', e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm md:col-span-3">
              <span className="font-medium">Notas</span>
              <textarea
                rows={2}
                value={form.notas}
                onChange={(e) => actualizar('notas', e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              />
            </label>

            <div className="flex gap-3 md:col-span-3">
              <button
                type="submit"
                disabled={guardando}
                className="rounded bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear cliente'}
              </button>
              {editandoId && (
                <button
                  type="button"
                  onClick={reiniciarFormulario}
                  className="rounded border border-black/15 px-5 py-2 font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Clientes ({clientes.length})</h2>

          {cargando ? (
            <p className="mt-4 opacity-70">Cargando...</p>
          ) : clientes.length === 0 ? (
            <p className="mt-4 opacity-70">
              Aún no tienes clientes. Crea el primero con el formulario.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Correo</th>
                    <th className="p-3 text-left">Teléfono</th>
                    <th className="p-3 text-left">RFC</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-black/5 dark:border-white/10">
                      <td className="p-3 font-medium">{cliente.nombre}</td>
                      <td className="p-3">{cliente.email ?? '-'}</td>
                      <td className="p-3">{cliente.telefono ?? '-'}</td>
                      <td className="p-3">{cliente.rfc ?? '-'}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editar(cliente)}
                            className="rounded border border-black/15 px-3 py-1 font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarCliente(cliente.id, cliente.nombre)}
                            className="rounded border border-red-500/40 px-3 py-1 font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Historial de cotizaciones ({cotizaciones.length})
          </h2>

          {cargando ? (
            <p className="mt-4 opacity-70">Cargando...</p>
          ) : cotizaciones.length === 0 ? (
            <p className="mt-4 opacity-70">
              Sin cotizaciones registradas. <Link className="text-blue-600 underline" href="/quoter">Crea la primera</Link>.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="p-3 text-left">Fecha</th>
                    <th className="p-3 text-left">Cliente</th>
                    <th className="p-3 text-left">F. venta</th>
                    <th className="p-3 text-left">F. adquisición</th>
                    <th className="p-3 text-right">Base gravable</th>
                    <th className="p-3 text-right">ISR</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((cotizacion) => (
                    <tr key={cotizacion.id} className="border-b border-black/5 dark:border-white/10">
                      <td className="p-3">{fecha(cotizacion.created_at)}</td>
                      <td className="p-3">{nombreDe(cotizacion.client_id)}</td>
                      <td className="p-3">{cotizacion.input_data?.fecha_venta ?? '-'}</td>
                      <td className="p-3">{cotizacion.input_data?.fecha_adquisicion ?? '-'}</td>
                      <td className="p-3 text-right">
                        {cotizacion.result_data?.base_gravable != null
                          ? moneda.format(cotizacion.result_data.base_gravable)
                          : '-'}
                      </td>
                      <td className="p-3 text-right font-medium text-blue-600">
                        {cotizacion.result_data?.isr_a_pagar != null
                          ? moneda.format(cotizacion.result_data.isr_a_pagar)
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Compras de créditos ({compras.length})</h2>

          {cargando ? (
            <p className="mt-4 opacity-70">Cargando...</p>
          ) : compras.length === 0 ? (
            <p className="mt-4 opacity-70">
              Sin compras registradas. <Link className="text-blue-600 underline" href="/credits">Comprar créditos</Link>.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="p-3 text-left">Fecha</th>
                    <th className="p-3 text-left">Paquete</th>
                    <th className="p-3 text-right">Créditos</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((compra) => (
                    <tr key={compra.id} className="border-b border-black/5 dark:border-white/10">
                      <td className="p-3">{fecha(compra.created_at)}</td>
                      <td className="p-3">{compra.package}</td>
                      <td className="p-3 text-right">{compra.credits}</td>
                      <td className="p-3 text-right">{moneda.format(compra.amount)}</td>
                      <td className="p-3">{compra.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
