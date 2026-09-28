import { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar sesión | Cotizador ISR Inmobiliario',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect = '/dashboard', error } = await searchParams;

  const mensajeError =
    error === 'confirmacion'
      ? 'No pudimos confirmar tu correo. El enlace venció o ya fue usado. Intenta iniciar sesión de nuevo.'
      : null;

  return <LoginForm redirect={redirect} errorInicial={mensajeError} />;
}
