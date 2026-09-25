/**
 * Supabase Client for Next.js
 * Configurado para usar en Server Components y Client Components
 * 
 * Variables de entorno requeridas:
 - NEXT_PUBLIC_SUPABASE_URL
 - NEXT_PUBLIC_SUPABASE_ANON_KEY
 - SUPABASE_SERVICE_ROLE_KEY (solo server-side)
 */

import { createBrowserClient, createServerClient, type TypeAuth } from '@supabase/ssr';

// Para entornos del lado del cliente (navigator)
export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient<TypeAuth>(url, key);
};

// Para renderizado del lado del servidor (App Router, Server Components, Route Handlers)
export const createServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient<TypeAuth>(url, key);
};

export type { TypeAuth };