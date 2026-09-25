import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Cotizador ISR Inmobiliario</h1>
      <nav className="space-x-4 mb-8">
        <Link href="/quoter" className="font-medium text-blue-600 hover:text-blue-800">
          Cotizar ISR
        </Link>
        <Link href="/credits" className="font-medium text-blue-600 hover:text-blue-800">
          Créditos (PayPal)
        </Link>
      </nav>
      <p className="text-lg">
        Sistema de cotización ISR por enajenación inmobiliaria basada en lógica Excel mexicana.
      </p>
    </main>
  );
}