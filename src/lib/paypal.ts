// Auxiliares para integración con PayPal (REST API v2).
// Si no hay credenciales configuradas, el sistema usa el modo simulación.

export const PAQUETES_CREDITOS: Record<string, number> = {
  basico: 10, // 10 cotizaciones
  profesional: 20, // 20 cotizaciones
  enterprise: 50, // 50 cotizaciones
};

export const PRECIOS_PAQUETES: Record<string, number> = {
  basico: 18,
  profesional: 35,
  enterprise: 80,
};

export function paypalConfigurado(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
  );
}

export function basePaypal(): string {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function obtenerTokenAcceso(): Promise<string> {
  const base = basePaypal();
  const credenciales = `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`;

  const respuesta = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(credenciales).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error_description ?? datos.error ?? 'No se pudo autenticar con PayPal');
  }

  return datos.access_token as string;
}

export async function crearOrdenPaypal(
  paquete: string,
  baseRedireccion: string
): Promise<{ id: string; aprobacion: string }> {
  const creditos = PAQUETES_CREDITOS[paquete];
  const precio = PRECIOS_PAQUETES[paquete];

  if (!creditos || !precio) {
    throw new Error('Paquete inválido');
  }

  const token = await obtenerTokenAcceso();

  const respuesta = await fetch(`${basePaypal()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: `${creditos} cotizaciones - paquete ${paquete}`,
          amount: {
            currency_code: 'MXN',
            value: precio.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'Cotizador ISR',
        locale: 'es-MX',
        user_action: 'PAY_NOW',
        return_url: `${baseRedireccion}/api/paypal/capture?paquete=${paquete}`,
        cancel_url: `${baseRedireccion}/credits?cancelado=1`,
      },
    }),
    cache: 'no-store',
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const detalle = datos.details?.[0]?.issue ?? datos.message ?? 'No se pudo crear la orden';
    throw new Error(detalle);
  }

  const linkAprobacion = (datos.links as { rel: string; href: string }[]).find(
    (enlace) => enlace.rel === 'approve'
  )?.href;

  if (!linkAprobacion) {
    throw new Error('No se recibió el enlace de aprobación de PayPal');
  }

  return { id: datos.id as string, aprobacion: linkAprobacion };
}

export async function capturarOrdenPaypal(
  ordenId: string
): Promise<{ status: string; id: string }> {
  const token = await obtenerTokenAcceso();

  const respuesta = await fetch(
    `${basePaypal()}/v2/checkout/orders/${encodeURIComponent(ordenId)}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      cache: 'no-store',
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const detalle = datos.details?.[0]?.issue ?? datos.message ?? 'No se pudo capturar el pago';
    throw new Error(detalle);
  }

  return { status: datos.status as string, id: datos.id as string };
}