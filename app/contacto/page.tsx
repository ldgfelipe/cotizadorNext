import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto | Cotizador ISR Inmobiliario',
  description: 'Contacta con Cotizador ISR Inmobiliario para dudas sobre cálculo fiscal, créditos y soporte.',
  keywords: ['contacto', 'soporte ISR', 'Cotizador ISR'],
};

export default function ContactoPage() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Contacto</h1>
        <p className="mt-2 opacity-70">
          ¿Tienes preguntas sobre el cálculo del ISR o nuestros planes de créditos? Escríbenos y te responderemos en menos de 24 horas.
        </p>

        <form className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Nombre completo</span>
            <input type="text" required className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Correo electrónico</span>
            <input type="email" required className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Asunto</span>
            <select className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent">
              <option>Cálculo ISR</option>
              <option>Créditos y pagos</option>
              <option>Soporte técnico</option>
              <option>Otro</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Mensaje</span>
            <textarea rows={6} className="rounded border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent" />
          </label>
          <button type="submit" className="rounded bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
            Enviar mensaje
          </button>
        </form>
      </div>
    </main>
  );
}
