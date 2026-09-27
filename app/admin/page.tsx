"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserRow { email: string; role?: string; created_at: string }
interface PurchaseRow { user_id: string; package: string; credits: number; amount: number; status: string }
interface QuoteRow { user_id: string; created_at: string; resultado?: { base_gravable?: number } }

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: profiles, error: ep } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!ep) setUsers(profiles || []);

      const { data: pur, error: ep2 } = await supabase.from('credit_purchases').select('*').order('created_at', { ascending: false });
      if (!ep2) setPurchases(pur || []);

      const { data: q, error: eq } = await supabase.from('quote_records').select('*').order('created_at', { ascending: false });
      if (!eq) setQuotes(q || []);

      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Panel de administración</h1>
        <p className="mt-2 opacity-70">Gestión de usuarios, compras y cotizaciones.</p>

        {loading ? (
          <p className="mt-8">Cargando...</p>
        ) : (
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold">Usuarios ({users.length})</h2>
              <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/15">
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Rol</th>
                      <th className="p-2 text-left">Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={i} className="border-b border-black/5 dark:border-white/10">
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">{u.role ?? 'user'}</td>
                        <td className="p-2">{new Date(u.created_at).toLocaleDateString('es-MX')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Compras ({purchases.length})</h2>
              <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/15">
                      <th className="p-2 text-left">Usuario</th>
                      <th className="p-2 text-left">Paquete</th>
                      <th className="p-2 text-left">Créditos</th>
                      <th className="p-2 text-left">Monto</th>
                      <th className="p-2 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p, i) => (
                      <tr key={i} className="border-b border-black/5 dark:border-white/10">
                        <td className="p-2">{p.user_id?.slice(0, 8) ?? '-'}</td>
                        <td className="p-2">{p.package}</td>
                        <td className="p-2">{p.credits}</td>
                        <td className="p-2">${p.amount}</td>
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
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/15">
                      <th className="p-2 text-left">Usuario</th>
                      <th className="p-2 text-left">Fecha</th>
                      <th className="p-2 text-left">Base gravable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q, i) => (
                      <tr key={i} className="border-b border-black/5 dark:border-white/10">
                        <td className="p-2">{q.user_id?.slice(0, 8) ?? '-'}</td>
                        <td className="p-2">{new Date(q.created_at).toLocaleDateString('es-MX')}</td>
                        <td className="p-2">${q.resultado?.base_gravable?.toLocaleString() ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
