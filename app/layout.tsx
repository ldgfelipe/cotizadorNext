import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Cotizador Venta Inmobiliaria ISR',
  description: 'Cotizador de ISR por enajenación con lógica matemática Mexican Excel-based',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.className}>
      <body className="bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}