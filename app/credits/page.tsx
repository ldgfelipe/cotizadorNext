import { useState } from 'react';
import Link from 'next/link';

export default function CreditsPage() {
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState<'basico' | 'profesional' | 'enterprise'>('basico');
  const [mostrandoExito, setMostrandoExito] = useState<boolean>(false);

  const paquetes = {
    basico: { nombre: 'Paquete Básico', creditos: 10, precio: 10 },
    profesional: { nombre: 'Paquete Profesional', creditos: 20, precio: 35 },
    enterprise: { nombre: 'Paquete Enterprise', creditos: 50, precio: 80 },
  };

  async function handlePago(paquete: typeof paquetes['basico']) {
    // Llamar al endpoint API de PayPal
    const response = await fetch('/api/paypal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monto: paquete.precio,
        paquete: paquete.nombre,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setMostrandoExito(true);
      // Aquí podríamos recargar la página o navegar
      setTimeout(() => setMostrandoExito(false), 3000);
    } else {
      alert('Error en el pago: ' + (data.error || 'Unknown error'));
    }
  }

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Comprar Créditos</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(paquetes).map(([clave, paquete]) => (
            <div
              key={clave}
              className={`p-4 border rounded hover:border-blue-500 transition-colors ${paqueteSeleccionado === clave ? 'bg-blue-500 text-white' : ''}`}
              onClick={() => setPaqueteSeleccionado(clave as any)}
            >
              <h3 className="text-xl font-bold mb-2">{paquete.nombre}</h3>
              <p className="text-sm text-gray-600">Créditos: {paquete.creditos} cotizaciones</p>
              <p className="text-lg font-bold">${paquete.precio}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-white rounded shadow" style={{ display: paquetesSeleccionado ? 'block' : 'none' }}>
          <h3>Resumen</h3>
          <p>Has seleccionado: <strong>{paquetes[paqueteSeleccionado].nombre}</strong></p>
          <p>Créditos a agregar: <strong>{paquetes[paqueteSeleccionado].creditos}</strong></p>
          <p>Precio: <strong>${paquetes[paqueteSeleccionado].precio}</strong></p>
          <button
            onClick={() => handlePago(paquetes[paqueteSeleccionado])}
            className="w-full py-2 bg-green-600 text-white mt-4 rounded hover:bg-green-700"
          >
            Pagar con PayPal
          </button>
        </div>

        {mostrandoExito && (
          <div className="mt-6 p-4 bg-green-100 text-green-800 rounded">
            <p>¡Pago exitoso! Los créditos han sido agregados a tu cuenta.</p>
          </div>
        )}
      </div>
    </main>
  );
}