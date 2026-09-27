import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Cotizador ISR Inmobiliario",
    template: "%s | Cotizador ISR Inmobiliario",
  },
  description:
    "Calcula tu ISR por enajenación inmobiliaria con precisión. Sistema profesional basado en lógica Excel para inversores, notarios y agentes inmobiliarios en México.",
  keywords: [
    "ISR",
    "ISR inmobiliario",
    "enajenación",
    "cotización ISR",
    "impuestos México",
    "infonavit",
    "UDI",
    "INPC",
    "cálculo fiscal",
    "real estate taxes Mexico",
    "ISR exención",
    "enajenación terreno",
    "cálculo ganancia patrimonial México",
  ],
  authors: [{ name: "Cotizador ISR" }],
  creator: "Cotizador ISR",
  publisher: "Cotizador ISR",
  formatDetection: { email: false, address: false },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Cotizador ISR Inmobiliario",
    title: "Cotizador ISR Inmobiliario",
    description:
      "Calcula tu ISR por enajenación inmobiliaria con precisión.",
    url: "https://cotizador-next-eight.vercel.app",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Cotizador ISR" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cotizador ISR Inmobiliario",
    description: "Calcula tu ISR por enajenación inmobiliaria con precisión.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
