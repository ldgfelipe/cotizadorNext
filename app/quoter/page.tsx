import { useState } from 'react';
import Link from 'next/link';

interface CotizacionDatos {
  fecha_venta: string;
  valor_escritura: number;
  porcentaje_enajenante: number;
  exenta: boolean;
  valor_terreno: number;
  valor_constr: number;
  fecha_adquisicion: string;
}

export default function QuoterPage() {
  const [datos, setDatos] = useState<CotizacionDatos>({
    fecha_venta: new Date().toISOString().split('T')[0],
    valor_escritura: 0,
    porcentaje_enajenante: 0,
    exenta: false,
    valor_terreno: 0,
    valor_constr: 0,
    fecha_adquisicion: '',
  });
  const [resultado, setResultado] = useState<any>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [creditos, setCreditos] = useState<number>(0);

  const calcularISR = async () => {
    setCargando(true);
    
    // Obtener INPC actual y histórico (en producción llamaría a Banxico)
    const inpcVenta = 130.50; // INPC 2024 estimado
    const inpcAdq = await new Promise<number>((resolve) => 
      resolve(125.50) // INPC 2023 estimado
    );

    // Llamar al servicio calculator server-side
    const response = await fetch('/api/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...datos,
        inpcVenta,
        inpcAdquisicion: inpcAdq,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      setResultado(data.resultado);
      setCreditos(prev => prev - 1); // Restar 1 crédito después de cálculo exitoso
    } else {
      alert('Error en el cálculo: ' + (data.error || 'Unknown error'));
    }
    
    setCargando(false);
  };

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Cotizador ISR Enajenación</h2>
        
        <form className="space-y-4 p-6 bg-white rounded shadow">
          {/* Fecha y Valores de Escrituración */}
          <div>
            <label className="block text-sm font-medium mb-2">Fecha de Venta</label>
            <input 
              type="date" 
              value={datos.fecha_venta}
              onChange={(e) => setDatos({ ...datos, fecha_venta: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Valor de Escrituración (Venta)</label>
            <input 
              type="number" 
              value={datos.valor_escritura}
              onChange={(e) => setDatos({ ...datos, valor_escritura: Number(e.target.value) })}
              step="any"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Porcentaje y Exención */}
          <div>
            <label className="block text-sm font-medium mb-2">Porcentaje de Enajenante (%)</label>
            <input 
              type="number" 
              value={datos.porcentaje_enajenante}
              onChange={(e) => setDatos({ ...datos, porcentaje_enajenante: Number(e.target.value) })}
              step="0.01"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Exención de Enajenante</label>
            <select
              value={datos.exenta}
              onChange={(e) => setDatos({ ...datos, exenta: e.target.value === 'true' })}
              className="w-full p-2 border rounded"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>

          {/* Valor original Terreno y Construcción */}
          <div>
            <label className="block text-sm font-medium mb-2">Valor Original Terreno</label>
            <input 
              type="number" 
              value={datos.valor_terreno}
              onChange={(e) => setDatos({ ...datos, valor_terreno: Number(e.target.value) })}
              step="any"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Valor Original Construcción</label>
            <input 
              type="number" 
              value={datos.valor_constr}
              onChange={(e) => setDatos({ ...datos, valor_constr: Number(e.target.value) })}
              step="any"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Fecha de adquisición */}
          <div>
            <label className="block text-sm font-medium mb-2">Fecha de Adquisición</label>
            <input 
              type="date" 
              value={datos.fecha_adquisicion}
              onChange={(e) => setDatos({ ...datos, fecha_adquisicion: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <button 
            type="submit"
            onClick={calcularISR}
            disabled={cargando}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {cargando ? 'Calculando...' : 'Calcular ISR'}
          </button>
        </form>

        {/* Mostrar Resultados */}
        {resultado && (
          <div className="mt-8 p-6 bg-gray-50 rounded shadow">
            <h3 className="text-xl font-bold mb-4">Resultados del Cálculo ISR</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Base Gravable</p>
                <p className="text-2xl font-bold">${resultado.base_gravable.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ISR a Pagar</p>
                <p className="text-2xl font-bold text-red-600">${resultado.isr_a_pagar.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">UDI Usada: {resultado.udi_usada}</p>
              <p className="text-sm text-gray-500">Factor de Ajuste: {resultado.factor_ajuste.toFixed(4)}</p>
              <p className="text-sm text-gray-500">INPC Ratio: {resultado.inpc_ratio.toFixed(4)}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}