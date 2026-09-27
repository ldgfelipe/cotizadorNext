"use client";

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/dashboard');
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

        <h1 className="mt-4 text-3xl font-bold">Crea tu cuenta</h1>
        <p className="mt-2 text-sm opacity-70">
          Regístrate para comenzar a cotizar ISR y administrar tus créditos.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Nombre completo</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            />
          </label>

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
              minLength={6}
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
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
