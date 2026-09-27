export const metadata = {
  title: 'Aviso de privacidad | Cotizador ISR Inmobiliario',
  description:
    'Aviso de privacidad de Cotizador ISR Inmobiliario. Conoce cómo recopilamos, usamos y protegemos tus datos personales conforme a la legislación mexicana.',
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-3xl prose dark:prose-invert">
        <h1 className="text-3xl font-bold">Aviso de privacidad</h1>
        <p className="mt-2 opacity-70">
          Última actualización: {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section className="mt-8 space-y-6">
          <p>
            En <strong>Cotizador ISR Inmobiliario</strong> (en adelante, el
            &ldquo;Responsable&rdquo;) somos responsables del tratamiento de
            tus datos personales y protegemos tu privacidad. El presente
            Aviso de Privacidad describe cómo recopilamos, usamos,
            almacenamos, protegemos y compartimos tu información.
          </p>

          <h2 className="text-xl font-semibold">1. Información que recopilamos</h2>
          <p>
            Cuando utilizas nuestros servicios, podemos recopilar la
            siguiente información:
          </p>
          <ul>
            <li>Nombre completo y correo electrónico</li>
            <li>Datos de autenticación (contraseña)</li>
            <li>Información de transacciones (compras de créditos, cotizaciones)</li>
            <li>Datos técnicos (dirección IP, tipo de navegador, datos de uso)</li>
          </ul>

          <h2 className="text-xl font-semibold">2. Finalidades del tratamiento</h2>
          <p>
            Tus datos se utilizan para:
          </p>
          <ul>
            <li>Proporcionar y mantener el servicio de cotización de ISR</li>
            <li>Gestionar la autenticación y el acceso a tu cuenta</li>
            <li>Procesar pagos y compras de créditos</li>
            <li>Mejorar nuestros productos y servicios</li>
            <li>Enviar comunicaciones relevantes sobre tu cuenta</li>
          </ul>

          <h2 className="text-xl font-semibold">3. Base legal</h2>
          <p>
            El tratamiento de tus datos se realiza conforme a la
            <em> Ley Federal de Protección de Datos Personales en Posesión
            de los Particulares </em> (LFPDPPP) y su reglamentación.
          </p>

          <h2 className="text-xl font-semibold">4. Tus derechos</h2>
          <p>
            Puedes acceder, rectificar, cancelar u oponerte al tratamiento de
            tus datos personales (derechos ARCO) contactándonos a través del
            formulario de contacto disponible en la sección de Contacto.
          </p>

          <h2 className="text-xl font-semibold">5. Cookies</h2>
          <p>
            Utilizamos cookies propias y de terceros para mejorar la
            navegación y analizar el uso de nuestro sitio. Puedes configurar
            o desactivar las cookies a través de la configuración de tu
            navegador.
          </p>

          <h2 className="text-xl font-semibold">6. Transferencias internacionales</h2>
          <p>
            Tus datos pueden ser transferidos y almacenados en servidores
            ubicados fuera de México, conforme a las políticas de{' '}
            <strong>Supabase</strong> y otros proveedores de servicios.
          </p>

          <h2 className="text-xl font-semibold">7. Cambios al aviso</h2>
          <p>
            Nos reservamos el derecho de actualizar este aviso en cualquier
            momento. La versión vigente estará siempre disponible en esta
            página.
          </p>

          <h2 className="text-xl font-semibold">8. Contacto</h2>
          <p>
            Para cualquier duda o ejercicio de derechos ARCO, contáctanos en:{' '}
            <a href="mailto:contacto@cotizadorisr.com">
              contacto@cotizadorisr.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
