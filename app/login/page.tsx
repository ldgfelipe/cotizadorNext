import { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar sesión | Cotizador ISR Inmobiliario',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect = '/dashboard' } = await searchParams;
  return <LoginForm redirect={redirect} />;
}