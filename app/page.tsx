import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cotizador ISR Inmobiliario',
  description: 'Calcula tu ISR por enajenación inmobiliaria con precisión.',
};

const MAPA_RUTAS_1 = [
  'M 30 90 C 140 60, 220 120, 330 80 S 520 40, 580 100',
  'M 40 250 C 150 220, 260 300, 380 260 S 540 180, 580 230',
  'M 120 380 C 240 340, 320 400, 460 370',
];
const MAPA_RUTAS_2 = [
  'M 90 30 C 180 110, 260 60, 380 140 S 520 260, 570 200',
  'M 20 180 C 120 200, 260 140, 400 200 S 520 330, 570 320',
];
const MAPA_RUTAS_3 = [
  'M 260 20 C 300 120, 180 200, 240 300 S 340 380, 460 390',
  'M 480 40 C 420 140, 540 220, 470 330',
];

const PUNTOS = [
  { estilo: 'left-[8%] top-[22%]', retardo: '0s' },
  { estilo: 'left-[55%] top-[18%]', retardo: '0.5s' },
  { estilo: 'left-[78%] top-[52%]', retardo: '1s' },
  { estilo: 'left-[38%] top-[68%]', retardo: '1.4s' },
  { estilo: 'left-[18%] top-[82%]', retardo: '1.9s' },
  { estilo: 'left-[70%] top-[88%]', retardo: '2.2s' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Héroe con mapa animado */}
      <section className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-600/30 bg-blue-600/10 px-3 py-1 text-xs font-semibold tracking-wide text-blue-600">
              ISR por enajenación inmobiliaria
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Calcula tu ISR con precisión{' '}
              <span className="text-blue-600">basada en Excel</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed opacity-80">
              Sistema profesional de cotización fiscal para inversores, notarios
              y agentes inmobiliarios en México. Lógica replicada del Excel de
              referencia: UDI, INPC, factor de ajuste y tabla de ISR.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/quoter"
                className="rounded bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Cotizar ISR
              </Link>
              <Link
                href="/login"
                className="rounded border border-blue-600 px-6 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-white/5"
              >
                Entrar a mi cuenta
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                { label: 'Cálculo ISR', desc: 'Base gravable y cuota según tabla fiscal' },
                { label: 'UDI e INPC', desc: 'Factor de ajuste por años de tenencia' },
                { label: 'Exención', desc: 'Operación exenta o general según tu caso' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-black/10 p-4 dark:border-white/15"
                >
                  <h3 className="font-semibold">{item.label}</h3>
                  <p className="mt-1 text-sm opacity-70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mapa animado con CSS */}
          <div className="mapa relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/10 shadow-2xl dark:border-white/10">
            <div className="mapa-rejilla absolute inset-0" />
            <div className="mapa-sat absolute inset-0 opacity-70" />

            <svg
              className="absolute inset-0 size-full"
              viewBox="0 0 600 400"
              aria-hidden="true"
              preserveAspectRatio="xMidYMid slice"
            >
              <g className="mapa-rutas mapa-rutas--1">
                {MAPA_RUTAS_1.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <g className="mapa-rutas mapa-rutas--2">
                {MAPA_RUTAS_2.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <g className="mapa-rutas mapa-rutas--3">
                {MAPA_RUTAS_3.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            </svg>

            {PUNTOS.map((punto, i) => (
              <span
                key={i}
                className={`mapa-punto absolute ${punto.estilo} size-3`}
                style={{ animationDelay: punto.retardo }}
              />
            ))}

            <div className="mapa-aurora absolute -left-10 top-4 size-64" />

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/40 px-4 py-3 text-xs text-slate-200 backdrop-blur">
              <span className="flex items-center gap-2">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                Mapa de cotizaciones activas
              </span>
              <span>+1,200 operaciones simuladas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Por qué usar */}
      <section className="border-t border-black/10 py-16 dark:border-white/15">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-10 text-center text-3xl font-bold">
            Por qué usar nuestra plataforma
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Cálculo ISR preciso',
                desc: 'Replica la lógica del Excel fiscal con factor UDI, INPC y tabla de excedente.',
              },
              {
                title: 'Seguimiento de créditos',
                desc: 'Compra cotizaciones, monitorea tu saldo y gestiona pagos desde un solo lugar.',
              },
              {
                title: 'Clientes y portafolio',
                desc: 'Da de alta clientes y asocia cada cotización a un portafolio para dar seguimiento.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-black/10 p-6 transition-shadow hover:shadow-lg dark:border-white/15"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm opacity-70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-black/10 bg-blue-600 py-16 text-white dark:border-white/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6">
          <div>
            <h2 className="text-3xl font-bold">¿Listo para cotizar?</h2>
            <p className="mt-2 opacity-90">
              Crea tu cuenta y empieza a calcular ISR con tus propios clientes.
            </p>
          </div>
          <Link
            href="/register"
            className="rounded bg-white px-6 py-3 font-semibold text-blue-700 transition-transform hover:scale-105"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/10 py-8 dark:border-white/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm opacity-70">
          <span>© {new Date().getFullYear()} Cotizador ISR Inmobiliario</span>
          <nav className="flex gap-6">
            <Link href="/contacto" className="hover:text-blue-600">
              Contacto
            </Link>
            <Link href="/aviso-privacidad" className="hover:text-blue-600">
              Aviso de privacidad
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}