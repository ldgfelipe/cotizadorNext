import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getUser } from '@/lib/server';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard | Cotizador ISR Inmobiliario',
  description: 'Tu panel personal para gestionar cotizaciones y créditos.',
};

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) redirect('/login?redirect=%2Fdashboard');

  return <DashboardClient email={user.email ?? ''} />;
}