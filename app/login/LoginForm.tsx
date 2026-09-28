"use client";

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

interface LoginFormProps {
  redirect: string;
  errorInicial?: string | null;
}

export default function LoginForm({ redirect, errorInicial = null }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorInicial);
  const [diagnostico, setDiagnostico] = useState<string | null>(null);

  async function revisarSesion(): Promise<void> {
    setDiagnostico('Revisando...');

    const nombresCookies = document.cookie
      .split('; ')
      .map((c) => c.split('=')[0])
      .filter((n) => n.includes('sb-') || n.includes('auth'));

    let estado: string;
    try {
      const {
        data: { user },
        error: errorUsuario,
      } = await supabase.auth.getUser();

      if (errorUsuario) {
        estado = `getUser() falló: ${errorUsuario.message}`;
      } else if (user) {
        estado = `Sesión válida como ${user.email}.`;
      } else {
        estado = 'getUser() no devuelve usuario.';
      }

      // Lo que VE EL SERVIDOR (proxy/rutas) con la misma cookie:
      let servidor: string;
      try {
        const respuesta = await fetch('/api/me');
        if (respuesta.ok) {
          const datos = (await respuesta.json()) as { email?: string };
          servidor = `Servidor: autenticado (${datos.email}).`;
        } else {
          servidor = `Servidor: NO autenticado (HTTP ${respuesta.status}).`;
        }
      } catch (err) {
        servidor = `Servidor: error al consultar /api/me (${err instanceof Error ? err.message : String(err)}).`;
      }

      setDiagnostico(
        `Cookies de sesión: ${nombresCookies.length > 0 ? nombresCookies.join(', ') : 'NINGUNA'}. ${estado} ${servidor}`
      );
    } catch (err) {
      setDiagnostico(`Excepción: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Confirma que la sesión quedó disponible en el cliente.
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setError(
          'La sesión no quedó disponible en el navegador. Usa "Verificar sesión" para diagnosticar.'
        );
        setLoading(false);
        return;
      }

      // Navegación dura: fuerza una petición nueva para que el proxy lea la cookie.
      window.location.assign(redirect.startsWith('/') ? redirect : '/dashboard');
    } catch {
      setError('Error de conexión o de navegación. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; Volver al inicio
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Inicia sesión</h1>
        <p className="mt-2 text-sm opacity-70">
          Accede a tu cuenta para gestionar cotizaciones y créditos.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Correo electrónico</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Contraseña</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
          </label>

          {(error || diagnostico) && (
            <div
              className={
                'rounded border px-4 py-3 text-sm ' +
                (diagnostico
                  ? 'border-slate-500/40 bg-slate-500/10'
                  : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400')
              }
            >
              {error}
              {diagnostico && <p className="mt-1 font-mono text-xs opacity-90">{diagnostico}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          onClick={revisarSesion}
          disabled={loading}
          className="mt-3 text-xs text-slate-500 underline hover:text-slate-700"
        >
          ¿Problemas? Verificar sesión
        </button>

        <p className="mt-6 text-sm text-center">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}