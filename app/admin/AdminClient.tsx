'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  created_at: string;
}

interface PurchaseRow {
  id: string;
  user_id: string;
  package: string;
  credits: number;
  amount: number;
  status: string;
  created_at: string;
}

interface QuoteRow {
  id: string;
  user_id: string;
  client_id: string | null;
  created_at: string;
  result_data: { base_gravable?: number } | null;
}

const fecha = (valor: string) =>
  new Date(valor).toLocaleDateString('es-MX', { dateStyle: 'medium' });

export default function AdminClient({ userId }: { userId: string }) {
  const router = useRouter();

  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [recargando, setRecargando] = useState<string | null>(null);
  const [refresco, setRefresco] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const { data: perfil, error: errorPerfil } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (errorPerfil || perfil?.role !== 'admin') {
        setAutorizado(false);
        return;
      }

      setAutorizado(true);

      const [usuarios, compras, cotizaciones] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase
          .from('credit_purchases')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('quote_records').select('*').order('created_at', { ascending: false }),
      ]);

      setUsers(usuarios.data ?? []);
      setPurchases(compras.data ?? []);
      setQuotes(cotizaciones.data ?? []);

      const fallo = usuarios.error ?? compras.error ?? cotizaciones.error;
      if (fallo) setError(fallo.message);
    }

    fetchData();
  }, [userId, refresco]);

  async function recargarCreditos(usuarioId: string, email: string) {
    const entrada = window.prompt(`Créditos a recargar para ${email}:`);
    if (entrada === null) return;

    const cantidad = parseInt(entrada, 10);
    if (Number.isNaN(cantidad) || cantidad <= 0) {
      setError('Ingresa una cantidad válida de créditos.');
      return;
    }

    setRecargando(usuarioId);
    setError(null);
    setMensaje(null);

    const { data, error: errorRpc } = await supabase.rpc('admin_recargar_creditos', {
      target_user: usuarioId,
      cantidad,
      motivo: 'recarga desde panel admin',
    });

    if (errorRpc) {
      setError(errorRpc.message);
    } else {
      setMensaje(`Recarga exitosa: ${data} crédito(s) agregados a ${email}.`);
      setRefresco((r) => r + 1);
    }

    setRecargando(null);
  }

  if (autorizado === null) {
    return (
      <main className="min-h-screen p-6 md:p-10">
        <p className="opacity-70">Verificando permisos...</p>
      </main>
    );
  }

  if (!autorizado) {
    return (
      <main className="min-h-screen p-6 md:p-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold">Acceso restringido</h1>
          <p className="mt-2 opacity-70">
            Esta cuenta no tiene permisos de administrador.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="mt-6 rounded bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Ir al dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Panel de administración</h1>
        <p className="mt-2 opacity-70">Gestión de usuarios, compras, cotizaciones y créditos.</p>

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

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold">Usuarios ({users.length})</h2>
            <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-left">Rol</th>
                    <th className="p-2 text-left">Creado</th>
                    <th className="p-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-black/5 dark:border-white/10">
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.full_name ?? '-'}</td>
                      <td className="p-2">{u.role ?? 'user'}</td>
                      <td className="p-2">{fecha(u.created_at)}</td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          disabled={recargando !== null}
                          onClick={() => recargarCreditos(u.id, u.email)}
                          className="rounded border border-green-600/40 px-2 py-1 font-medium text-green-700 transition-colors hover:bg-green-500/10 disabled:opacity-50 dark:text-green-400"
                        >
                          {recargando === u.id ? '...' : 'Recargar créditos'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Compras ({purchases.length})</h2>
            <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="p-2 text-left">Usuario</th>
                    <th className="p-2 text-left">Paquete</th>
                    <th className="p-2 text-right">Créditos</th>
                    <th className="p-2 text-right">Monto</th>
                    <th className="p-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} className="border-b border-black/5 dark:border-white/10">
                      <td className="p-2">{p.user_id.slice(0, 8)}</td>
                      <td className="p-2">{p.package}</td>
                      <td className="p-2 text-right">{p.credits}</td>
                      <td className="p-2 text-right">${p.amount}</td>
                      <td className="p-2">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Cotizaciones ({quotes.length})</h2>
            <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="p-2 text-left">Usuario</th>
                    <th className="p-2 text-left">Cliente</th>
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-right">Base gravable</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-b border-black/5 dark:border-white/10">
                      <td className="p-2">{q.user_id.slice(0, 8)}</td>
                      <td className="p-2">{q.client_id ? q.client_id.slice(0, 8) : '-'}</td>
                      <td className="p-2">{fecha(q.created_at)}</td>
                      <td className="p-2 text-right">
                        {q.result_data?.base_gravable != null
                          ? `$${q.result_data.base_gravable.toLocaleString('es-MX')}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
