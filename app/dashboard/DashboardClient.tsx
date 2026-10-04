'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

interface Movimiento {
  paso: number;
  titulo: string;
  detalle: string;
  monto: number | null;
  categoria?: string;
}

interface Cotizacion {
  id: string;
  client_id: string | null;
  input_data: {
    fecha_venta?: string;
    fecha_adquisicion?: string;
    valor_escritura?: number;
  } & Record<string, unknown>;
  result_data: {
    base_gravable?: number;
    isr_a_pagar?: number;
    inpc_venta?: number;
    inpc_adquisicion?: number;
    udi_usada?: number;
    anos_tenencia?: number;
    factor_ajuste?: number;
    inpc_ratio?: number;
    valor_construccion_ajustado?: number;
    valor_presente?: number;
    movimientos?: Movimiento[];
  } & Record<string, unknown>;
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

const moneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

export default function DashboardClient({ email }: { email: string }) {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formRfc, setFormRfc] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  const [nombrePerfil, setNombrePerfil] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  const [cotizacionAbierta, setCotizacionAbierta] = useState<string | null>(null);

  const valorEmpresa = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

  const cargarDatos = useCallback(async () => {
    const [cRes, coRes, cpRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase
        .from('quote_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('credit_purchases')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    setClientes(cRes.data ?? []);
    setCotizaciones(coRes.data ?? []);
    setCompras(cpRes.data ?? []);

    const primerError = coRes.error ?? cpRes.error ?? cRes.error;
    if (primerError) setError(primerError.message);

    setCargando(false);
  }, []);

  useEffect(() => {
    // Carga inicial de datos del dashboard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    (async () => {
      const { data: perfil } = await supabase.from('profiles').select('full_name').maybeSingle();
      if (perfil?.full_name) setNombrePerfil(perfil.full_name);
    })();
  }, []);

  const totalCreditos = compras
    .filter((c) => c.status === 'completed')
    .reduce((suma, c) => suma + c.credits, 0);
  const totalCotizaciones = cotizaciones.length;
  const totalClientes = clientes.length;
  const creditosDisponibles = totalCreditos - totalCotizaciones;

  function reiniciarForm() {
    setFormNombre('');
    setFormEmail('');
    setFormTelefono('');
    setFormRfc('');
    setEditandoId(null);
  }

  function empezarEditar(cliente: Cliente) {
    setEditandoId(cliente.id);
    setFormNombre(cliente.nombre);
    setFormEmail(cliente.email ?? '');
    setFormTelefono(cliente.telefono ?? '');
    setFormRfc(cliente.rfc ?? '');
  }

  async function guardarCliente(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardandoCliente(true);
    setError(null);
    setMensaje(null);

    const payload = {
      nombre: formNombre.trim(),
      email: formEmail.trim() || null,
      telefono: formTelefono.trim() || null,
      rfc: formRfc.trim() || null,
    };

    const consulta = editandoId
      ? supabase.from('clients').update(payload).eq('id', editandoId)
      : supabase.from('clients').insert(payload);

    const { error: errorGuardado } = await consulta;

    if (errorGuardado) {
      setError(errorGuardado.message);
    } else {
      setMensaje(editandoId ? 'Cliente actualizado.' : 'Cliente creado.');
      reiniciarForm();
      await cargarDatos();
    }

    setGuardandoCliente(false);
  }

  async function eliminarCliente(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar a ${nombre}?`)) return;
    setError(null);
    setMensaje(null);
    const { error: errorBorrado } = await supabase.from('clients').delete().eq('id', id);
    if (errorBorrado) {
      setError(errorBorrado.message);
      return;
    }
    setMensaje('Cliente eliminado.');
    await cargarDatos();
  }

  async function guardarPerfil() {
    setGuardandoPerfil(true);
    setError(null);
    setMensaje(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión');

      const { error: errorPerfil } = await supabase
        .from('profiles')
        .update({ full_name: nombrePerfil.trim() || null })
        .eq('id', user.id);

      if (errorPerfil) throw errorPerfil;
      setMensaje('Perfil actualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el perfil');
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]));

  function nombreCliente(id: string | null) {
    if (!id) return 'Sin cliente';
    return clienteMap.get(id) ?? id.slice(0, 8);
  }

  function monedaVal(valor: unknown) {
    const num = Number(valor);
    return Number.isFinite(num) ? moneda.format(num) : '-';
  }

  function cadena(valor: unknown) {
    return valor == null || valor === '' ? '-' : String(valor);
  }

  function renderDetalleCotizacion(co: Cotizacion) {
    const entrada = co.input_data ?? {};
    const resultado = co.result_data ?? {};
    const movimientos = (resultado.movimientos as Movimiento[] | undefined) ?? [];

    const itemsEntrada: Array<[string, string]> = [
      ['Fecha de venta', cadena(entrada.fecha_venta)],
      ['Fecha de adquisición', cadena(entrada.fecha_adquisicion)],
      ['Años de tenencia', cadena(resultado.anos_tenencia)],
      ['Valor de escrituración', monedaVal(entrada.valor_escritura)],
      ['Porcentaje de enajenante', `${cadena(entrada.porcentaje_enajenante)}%`],
      ['Valor del terreno', monedaVal(entrada.valor_terreno)],
      ['Valor de construcción', monedaVal(entrada.valor_constr)],
      ['Operación exenta', entrada.exenta ? 'Sí' : 'No'],
      ['INPC de venta', cadena(resultado.inpc_venta)],
      ['INPC de adquisición', cadena(resultado.inpc_adquisicion)],
      ['Valor UDI (referencia)', cadena(resultado.udi_usada)],
      ['Factor de ajuste', cadena(resultado.factor_ajuste)],
      ['Ratio INPC', cadena(resultado.inpc_ratio)],
      ['Valor de construcción ajustado', monedaVal(resultado.valor_construccion_ajustado)],
      ['Valor presente del inmueble', monedaVal(resultado.valor_presente)],
    ];

    return (
      <div className="mt-4 rounded-lg border border-black/10 bg-black/[0.02] p-4 md:p-6 dark:border-white/15 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold">
            Detalle de cotización · {nombreCliente(co.client_id)}
          </h3>
          <button
            type="button"
            onClick={() => setCotizacionAbierta(null)}
            className="rounded border border-black/15 px-3 py-1 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
          >
            Cerrar
          </button>
        </div>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide opacity-70">
          Datos de la operación
        </h4>
        <div className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {itemsEntrada.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
              <span className="opacity-70">{etiqueta}</span>
              <span className="font-semibold">{valor}</span>
            </div>
          ))}
        </div>

        <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide opacity-70">
          Movimientos del cálculo
        </h4>
        {movimientos.length === 0 ? (
          <p className="mt-2 text-sm opacity-70">Sin movimientos guardados para esta cotización.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/15">
                  <th className="p-2 text-left">Paso</th>
                  <th className="p-2 text-left">Concepto</th>
                  <th className="p-2 text-left">Detalle</th>
                  <th className="p-2 text-left">Categoría</th>
                  <th className="p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={i} className="border-b border-black/5 dark:border-white/10">
                    <td className="p-2 text-right">{m.paso}</td>
                    <td className="p-2 font-medium">{m.titulo}</td>
                    <td className="p-2 opacity-80">{m.detalle}</td>
                    <td className="p-2 opacity-80">{m.categoria ?? '-'}</td>
                    <td className="p-2 text-right font-semibold">
                      {m.monto == null ? '—' : valorEmpresa.format(m.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-black/10 bg-blue-50 dark:border-white/15 dark:bg-blue-500/10">
                  <td className="p-2 font-semibold" colSpan={4}>
                    Base gravable
                  </td>
                  <td className="p-2 text-right font-bold">
                    {monedaVal(resultado.base_gravable)}
                  </td>
                </tr>
                <tr className="bg-blue-100 dark:bg-blue-500/20">
                  <td className="p-2 font-semibold" colSpan={4}>
                    ISR a pagar
                  </td>
                  <td className="p-2 text-right font-bold text-blue-700 dark:text-blue-300">
                    {monedaVal(resultado.isr_a_pagar)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
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

        {(error || mensaje) && (
          <div
            className={
              'mb-6 rounded border px-4 py-3 text-sm ' +
              (error
                ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400')
            }
          >
            {error ?? mensaje}
          </div>
        )}

        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-black/10 p-6 dark:border-white/15">
            <div className="text-2xl font-medium text-blue-600">{totalClientes}</div>
            <p className="mt-1 text-sm opacity-70">Clientes</p>
          </div>
          <div className="rounded-lg border border-black/10 p-6 dark:border-white/15">
            <div className="text-2xl font-medium text-green-600">{creditosDisponibles}</div>
            <p className="mt-1 text-sm opacity-70">Créditos disponibles</p>
          </div>
          <div className="rounded-lg border border-black/10 p-6 dark:border-white/15">
            <div className="text-2xl font-medium text-purple-600">{totalCotizaciones}</div>
            <p className="mt-1 text-sm opacity-70">Cotizaciones</p>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold">Mis clientes ({totalClientes})</h2>

          <form
            onSubmit={guardarCliente}
            className="mt-4 grid gap-4 rounded-lg border border-black/10 p-4 md:grid-cols-4 dark:border-white/15"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Nombre *</span>
              <input
                type="text"
                required
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Correo</span>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Teléfono</span>
              <input
                type="tel"
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">RFC</span>
              <input
                type="text"
                value={formRfc}
                onChange={(e) => setFormRfc(e.target.value)}
                className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
              />
            </label>
            <div className="flex gap-3 md:col-span-4">
              <button
                type="submit"
                disabled={guardandoCliente}
                className="rounded bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {guardandoCliente
                  ? 'Guardando...'
                  : editandoId
                    ? 'Guardar cambios'
                    : 'Agregar cliente'}
              </button>
              {editandoId && (
                <button
                  type="button"
                  onClick={reiniciarForm}
                  className="rounded border border-black/15 px-5 py-2 font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {cargando ? (
            <p className="mt-4 opacity-70">Cargando...</p>
          ) : totalClientes === 0 ? (
            <p className="mt-4 opacity-70">Aún no tienes clientes. Usa el formulario para agregar el primero.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Correo</th>
                    <th className="p-3 text-left">Teléfono</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-b border-black/5 dark:border-white/10">
                      <td className="p-3 font-medium">{c.nombre}</td>
                      <td className="p-3">{c.email ?? '-'}</td>
                      <td className="p-3">{c.telefono ?? '-'}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => empezarEditar(c)}
                            className="rounded border border-black/15 px-2 py-1 font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarCliente(c.id, c.nombre)}
                            className="rounded border border-red-500/40 px-2 py-1 font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
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

        <section className="mb-8">
          <h2 className="text-xl font-semibold">Historial de cotizaciones ({totalCotizaciones})</h2>
          {cargando ? (
            <p className="mt-4 opacity-70">Cargando...</p>
          ) : totalCotizaciones === 0 ? (
            <p className="mt-4 opacity-70">
              Sin cotizaciones registradas.{' '}
              <Link className="text-blue-600 underline" href="/quoter">
                Crea la primera
              </Link>
              .
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
                    <th className="p-3 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((c) => (
                    <tr key={c.id} className="border-b border-black/5 dark:border-white/10">
                      <td className="p-3">{new Date(c.created_at).toLocaleDateString('es-MX')}</td>
                      <td className="p-3">{nombreCliente(c.client_id)}</td>
                      <td className="p-3">{c.input_data?.fecha_venta ?? '-'}</td>
                      <td className="p-3">{c.input_data?.fecha_adquisicion ?? '-'}</td>
                      <td className="p-3 text-right">
                        {c.result_data?.base_gravable != null
                          ? moneda.format(c.result_data.base_gravable)
                          : '-'}
                      </td>
                      <td className="p-3 text-right font-medium text-blue-600">
                        {c.result_data?.isr_a_pagar != null
                          ? moneda.format(c.result_data.isr_a_pagar)
                          : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setCotizacionAbierta(cotizacionAbierta === c.id ? null : c.id)
                            }
                            className="rounded border border-black/15 px-2 py-1 font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                          >
                            {cotizacionAbierta === c.id ? 'Ocultar' : 'Ver detalle'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {cotizacionAbierta &&
            ((() => {
              const abierta = cotizaciones.find((c) => c.id === cotizacionAbierta);
              return abierta ? renderDetalleCotizacion(abierta) : null;
            })())}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold">Mis créditos ({compras.length})</h2>
          {cargando ? (
            <p className="mt-4 opacity-70">Cargando...</p>
          ) : totalCreditos === 0 ? (
            <p className="mt-4 opacity-70">
              Sin compras de créditos registradas.{' '}
              <Link className="text-blue-600 underline" href="/credits">
                Compra créditos
              </Link>
              .
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
                  {compras.map((c) => (
                    <tr key={c.id} className="border-b border-black/5 dark:border-white/10">
                      <td className="p-3">{new Date(c.created_at).toLocaleDateString('es-MX')}</td>
                      <td className="p-3">{c.package}</td>
                      <td className="p-3 text-right">{c.credits}</td>
                      <td className="p-3 text-right">{moneda.format(c.amount)}</td>
                      <td className="p-3">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold">Editar perfil</h2>
          <div className="mt-4 rounded-lg border border-black/10 p-4 dark:border-white/15">
            <p className="text-sm opacity-70">Correo: {email}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Nombre completo</span>
                <input
                  type="text"
                  value={nombrePerfil}
                  onChange={(e) => setNombrePerfil(e.target.value)}
                  className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
                  placeholder="Tu nombre"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={guardarPerfil}
                  disabled={guardandoPerfil}
                  className="rounded bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                >
                  {guardandoPerfil ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}