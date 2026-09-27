"use client";

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface LoginFormProps {
  redirect: string;
}

export default function LoginForm({ redirect }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
          </label>

          {error && (
            <p className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

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