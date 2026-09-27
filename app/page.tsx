import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cotizador ISR Inmobiliario',
  description: 'Calcula tu ISR por enajenación inmobiliaria con precisión.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="relative mx-auto max-w-6xl px-6 py-20 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold tracking-wide text-blue-600">
              ISR por enajenación inmobiliaria
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Calcula tu ISR con precisión{' '}
              <span className="text-blue-600">basada en Excel</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed opacity-80">
              Sistema profesional de cotización fiscal para inversores,
              notarios y agentes inmobiliarios en México. Lógica matemática
              replicada del Excel de referencia: UDI, INPC, factor de ajuste
              y tabla de ISR.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a href="/quoter" className="rounded bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
                Cotizar ISR
              </a>
              <a href="/credits" className="rounded border border-blue-600 px-6 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-white/5">
                Comprar créditos
              </a>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                { label: 'Cálculo ISR', desc: 'Base gravable y cuota según tabla fiscal' },
                { label: 'UDI e INPC', desc: 'Factor de ajuste por años de tenencia' },
                { label: 'Seguro', desc: 'Operación exenta o general según tu caso' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-black/10 p-4 dark:border-white/15">
                  <h3 className="font-semibold">{item.label}</h3>
                  <p className="mt-1 text-sm opacity-70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="order-first rounded-xl border border-black/10 bg-white p-8 shadow-lg dark:border-white/15 dark:bg-background md:order-last">
            <h2 className="mb-6 text-2xl font-bold">Bienvenido</h2>
            <p className="mb-6 opacity-70">Inicia sesión para gestionar tus cotizaciones y créditos.</p>
            <p className="text-sm opacity-70">
              ¿No tienes cuenta?{' '}
              <a href="/register" className="font-medium text-blue-600 hover:underline">Regístrate</a>
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 bg-background py-16 dark:border-white/15">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-10 text-center text-3xl font-bold">Por qué usar nuestra plataforma</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: 'Cálculo ISR preciso', desc: 'Replica la lógica del Excel fiscal con factor UDI, INPC y tabla de excedente.' },
              { title: 'Seguimiento de créditos', desc: 'Compra cotizaciones, monitorea tu saldo y gestiona pagos desde un solo lugar.' },
              { title: 'Seguro y confidencial', desc: 'Tus datos se protegen con Supabase Auth y políticas RLS en la base de datos.' },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-black/10 p-6 dark:border-white/15">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm opacity-70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 py-8 dark:border-white/15">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap justify-between gap-4 text-sm opacity-70">
          <span>© {new Date().getFullYear()} Cotizador ISR Inmobiliario</span>
          <nav className="flex gap-6">
            <a href="/contacto" className="hover:text-blue-600">Contacto</a>
            <a href="/aviso-privacidad" className="hover:text-blue-600">Aviso de privacidad</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
