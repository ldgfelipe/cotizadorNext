import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Cotizador ISR Inmobiliario',
  description: 'Tu panel personal para gestionar cotizaciones y créditos.',
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 opacity-70">Bienvenido. Revisa tus cotizaciones y compras de créditos.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border border-black/10 p-6 dark:border-white/15">
            <h2 className="text-xl font-semibold">Compras de créditos</h2>
            <p className="mt-2 opacity-70">Sin compras registradas aún.</p>
          </section>
          <section className="rounded-lg border border-black/10 p-6 dark:border-white/15">
            <h2 className="text-xl font-semibold">Historial de cotizaciones</h2>
            <p className="mt-2 opacity-70">Sin cotizaciones registradas aún.</p>
          </section>
        </div>

        <div className="mt-8 flex gap-4">
          <a href="/quoter" className="rounded bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
            Nueva cotización
          </a>
          <a href="/credits" className="rounded border border-blue-600 px-5 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-white/5">
            Comprar créditos
          </a>
        </div>
      </div>
    </main>
  );
}
