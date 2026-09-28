import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getUser } from '@/lib/server';
import AdminClient from './AdminClient';

export const metadata: Metadata = {
  title: 'Administración | Cotizador ISR Inmobiliario',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await getUser();

  if (!user) redirect('/login?redirect=%2Fadmin');

  return <AdminClient userId={user.id} />;
}
