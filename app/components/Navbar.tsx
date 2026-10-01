'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const ENLACES = [
  { href: '/', etiqueta: 'Inicio' },
  { href: '/quoter', etiqueta: 'Cotizador' },
  { href: '/credits', etiqueta: 'Créditos' },
  { href: '/contacto', etiqueta: 'Contacto' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [usuario, setUsuario] = useState<{ email: string; nombre?: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargarUsuario() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!activo) return;

      if (user) {
        const { data: perfil } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        setUsuario({
          email: user.email ?? '',
          nombre: perfil?.full_name ?? undefined,
        });
      } else {
        setUsuario(null);
      }

      setCargando(false);
    }

    cargarUsuario();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    // Cierra el menú móvil al cambiar de ruta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAbierto(false);
  }, [pathname]);

  const cerrarSesion = useCallback(async () => {
    await supabase.auth.signOut();
    router.refresh();
    // Navegación dura: limpia cookies y reinicia el estado del servidor.
    window.location.assign('/');
  }, [router]);

  const enRuta = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-background/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white">
            ISR
          </span>
          <span className="hidden sm:inline">
            Cotizador <span className="text-blue-600">ISR</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {ENLACES.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={
                'rounded px-3 py-2 text-sm font-medium transition-colors ' +
                (enRuta(enlace.href)
                  ? 'bg-blue-600/10 text-blue-600'
                  : 'hover:bg-black/5 dark:hover:bg-white/10')
              }
            >
              {enlace.etiqueta}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {cargando ? null : usuario ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full border border-black/10 py-1 pl-1 pr-3 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                <span className="grid size-7 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {(usuario.nombre ?? usuario.email)[0]?.toUpperCase()}
                </span>
                <span className="max-w-[10rem] truncate text-sm">
                  {usuario.nombre ?? usuario.email}
                </span>
              </Link>
              <button
                type="button"
                onClick={cerrarSesion}
                className="rounded border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-600/10"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Regístrate
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={abierto}
          onClick={() => setAbierto((previo) => !previo)}
          className="grid size-10 place-items-center rounded-lg border border-black/15 md:hidden dark:border-white/20"
        >
          <span className="flex w-5 flex-col gap-1.5">
            <span
              className={
                'h-0.5 rounded bg-current transition-transform ' +
                (abierto ? 'translate-y-2 rotate-45' : '')
              }
            />
            <span className={abierto ? 'opacity-0' : 'h-0.5 rounded bg-current'} />
            <span
              className={
                'h-0.5 rounded bg-current transition-transform ' +
                (abierto ? '-translate-y-2 -rotate-45' : '')
              }
            />
          </span>
        </button>
      </nav>

      {abierto && (
        <div className="border-t border-black/10 px-6 py-4 md:hidden dark:border-white/10">
          <div className="flex flex-col gap-1">
            {ENLACES.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={
                  'rounded px-3 py-2 text-sm font-medium ' +
                  (enRuta(enlace.href)
                    ? 'bg-blue-600/10 text-blue-600'
                    : 'hover:bg-black/5 dark:hover:bg-white/10')
                }
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
            {cargando ? null : usuario ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  className="rounded bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Mi dashboard
                </Link>
                <div className="flex items-center justify-between rounded border border-black/10 px-3 py-2 text-sm dark:border-white/15">
                  <span className="truncate">
                    {usuario.nombre ?? usuario.email}
                  </span>
                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="font-medium text-red-600"
                  >
                    Salir
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="rounded border border-blue-600 px-4 py-2 text-center text-sm font-semibold text-blue-600"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="rounded bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Regístrate
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}