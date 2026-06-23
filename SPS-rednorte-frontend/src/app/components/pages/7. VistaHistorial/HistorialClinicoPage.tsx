import React, { useState } from 'react';
import { Search, ArrowLeft, UserX } from 'lucide-react';
import { HistoryView } from './HistoryView'; // Importas tu vista exacta tal cual la tienes
import { Card, CardContent } from '../../ui/card';

// Interfaz para las props que le pasarás desde tu contexto de autenticación o sidebar
interface HistorialClinicoPageProps {
  userRole: 'PACIENTE' | 'MEDICO' | string;
  loggedPatientId?: string; // Solo vendrá si el usuario es PACIENTE (ej: "p-196655077")
}

export function HistorialClinicoPage({ userRole, loggedPatientId }: HistorialClinicoPageProps) {
  // Estados exclusivos para el flujo del médico
  const [rutBusqueda, setRutBusqueda] = useState('');
  const [pacienteEncontradoId, setPacienteEncontradoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. FLUJO PACIENTE: Renderiza directamente su ficha clínica
  if (userRole === 'PACIENTE') {
    return <HistoryView patientId={loggedPatientId} />;
  }

  // 2. FLUJO MÉDICO: Manejador de la búsqueda por RUT
  const handleBuscarRut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rutBusqueda.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Buscamos al paciente en FHIR por su RUT (identifier)
      // Ajusta el puerto (8085) o la ruta si pasas esto por tu API Gateway
      const response = await fetch(`http://localhost:8085/fhir/Patient?identifier=${rutBusqueda}`, {
        headers: { 'Accept': 'application/fhir+json' }
      });

      if (!response.ok) throw new Error('Error al conectar con el servidor FHIR');

      const data = await response.json();

      if (data.total > 0) {
        // Obtenemos el ID interno del recurso FHIR (ej: "p-196655077")
        const fhirId = data.entry[0].resource.id;
        setPacienteEncontradoId(fhirId);
      } else {
        setError('No se encontró ninguna ficha clínica asociada a este RUT.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión al buscar paciente.');
    } finally {
      setLoading(false);
    }
  };

  // 3. FLUJO MÉDICO (PACIENTE ENCONTRADO): Muestra botón volver + la Ficha
  if (userRole === 'MEDICO' && pacienteEncontradoId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setPacienteEncontradoId(null);
            setRutBusqueda('');
          }}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 px-3 py-2 rounded-md w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al buscador
        </button>
        
        {/* Reutilizamos tu componente intacto, inyectándole el ID encontrado */}
        <HistoryView patientId={pacienteEncontradoId} />
      </div>
    );
  }

  // 4. FLUJO MÉDICO (BUSCADOR INICIAL): Vista para buscar el RUT
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Acceso a Ficha Clínica</h2>
        <p className="text-gray-500 mt-2">Ingrese el RUT del paciente para consultar su historial médico en la red.</p>
      </div>

      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardContent className="p-6">
          <form onSubmit={handleBuscarRut} className="space-y-4">
            <div>
              <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
                RUT del Paciente
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="rut"
                  value={rutBusqueda}
                  onChange={(e) => setRutBusqueda(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Ej: 19665507-7"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-md text-sm border border-red-100">
                <UserX className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !rutBusqueda}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Buscando en red...
                </>
              ) : (
                'Buscar Ficha'
              )}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}