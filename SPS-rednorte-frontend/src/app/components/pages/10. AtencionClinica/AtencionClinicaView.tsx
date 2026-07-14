import React, { useState } from 'react';
import { ArrowLeft, Save, User, Activity, FileText, CheckCircle } from 'lucide-react';

interface AtencionClinicaViewProps {
  encounterId: string | null;
  appointmentId: string | null;
  patientId: string | null;
  patientName: string | null; // <-- NUEVO
  patientRut: string | null;  // <-- NUEVO
  patientAge: string | null; // 👇 1. AGREGAR A LA INTERFAZ
  onVolver: () => void;
}

export function AtencionClinicaView({ encounterId, appointmentId, patientId, patientName, patientRut, patientAge, onVolver }: AtencionClinicaViewProps) {
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [anamnesis, setAnamnesis] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [recetaMedicamentos, setRecetaMedicamentos] = useState('');
  const [recetaIndicaciones, setRecetaIndicaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleImprimirReceta = () => {
    window.print();
  };

  const handleFinalizarAtencion = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
        // 1. GUARDAR LA NOTA CLÍNICA (Motivo y Anamnesis)
        const noteResponse = await fetch('/api/v1/clinical-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            encounterId: encounterId,
            patientId: patientId, // <-- Asegúrate de pasar esto como prop a la vista
            title: "Evolución Médica", // Ajusta estos nombres de campos...
            text: `Motivo de Consulta: ${motivoConsulta}\nAnamnesis: ${anamnesis}\n\n---\nReceta Emitida:\nMedicamentos: ${recetaMedicamentos}\nIndicaciones: ${recetaIndicaciones}`, // ...a lo que espere tu ClinicalNoteDTO
            authorId: "Practitioner/123" // Opcional, si tu DTO requiere el ID del médico
            })
        });

        if (!noteResponse.ok) throw new Error("Error al guardar la nota clínica");

        // 2. GUARDAR EL DIAGNÓSTICO (Condition)
        const conditionResponse = await fetch('/api/v1/conditions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            // encounterId: encounterId, // Comentado para evitar error HAPI-1094 de integridad referencial
            patientId: patientId,
            clinicalStatus: "active", // Ajusta a tu ConditionDTO
            code: diagnostico // El texto del diagnóstico
            })
        });

        if (!conditionResponse.ok) throw new Error("Error al guardar el diagnóstico");

        // 3. ACTUALIZAR ESTADO DE LA CITA (Lo que ya te funciona)
        const statusResponse = await fetch(`/agendas/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'fulfilled' })
        });

        if (!statusResponse.ok) throw new Error("Error al actualizar la cita");

        import('sweetalert2').then(Swal => {
            Swal.default.fire({
                icon: 'success',
                title: 'Atención Finalizada',
                text: 'Datos clínicos guardados exitosamente.',
                confirmButtonColor: '#004a87'
            });
        });
        onVolver(); 
        
        } catch (error) {
        console.error("Error al finalizar:", error);
        import('sweetalert2').then(Swal => {
            Swal.default.fire({
                icon: 'error',
                title: 'Error de Servidor',
                text: 'Hubo un error al guardar los datos clínicos.',
                confirmButtonColor: '#e63946'
            });
        });
        } finally {
        setIsSaving(false);
        }
    };

      if (!encounterId && !appointmentId) {
    return <div className="p-8 text-center text-slate-500">No hay atención activa.</div>;
  }

  const currentDate = new Date().toLocaleDateString('es-CL');

  return (
    <div className="p-6 bg-slate-50 min-h-screen relative">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receta-imprimible, #receta-imprimible * {
            visibility: visible;
          }
          #receta-imprimible {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
        }
      `}</style>

      {/* COMPONENTE OCULTO PARA IMPRIMIR LA RECETA */}
      <div id="receta-imprimible" className="hidden print:block bg-white text-black p-8 rounded border border-gray-200">
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">RedNorte Salud</h1>
            <p className="text-sm">Av. Principal 123, Ciudad</p>
            <p className="text-sm">Teléfono: +56 9 1234 5678</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">RECETA MÉDICA</h2>
            <p className="text-sm font-semibold">Fecha: {currentDate}</p>
          </div>
        </div>
        
        <div className="mb-6 grid grid-cols-2 gap-4 text-sm border border-gray-300 p-4 rounded bg-gray-50">
          <div>
            <p><span className="font-bold">Paciente:</span> {patientName || 'N/A'}</p>
            <p><span className="font-bold">RUT:</span> {patientRut || 'N/A'}</p>
          </div>
          <div>
            <p><span className="font-bold">Edad:</span> {patientAge !== '--' ? `${patientAge} años` : 'N/A'}</p>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-lg font-bold border-b border-gray-300 mb-4 pb-2">Rx - Prescripción</h3>
          <div className="whitespace-pre-wrap text-base mb-6 font-mono bg-white p-4 min-h-[100px] border border-gray-200 rounded">
            {recetaMedicamentos || 'Sin medicamentos prescritos.'}
          </div>
          
          <h3 className="text-lg font-bold border-b border-gray-300 mb-4 pb-2">Indicaciones Generales</h3>
          <div className="whitespace-pre-wrap text-base font-mono bg-white p-4 min-h-[100px] border border-gray-200 rounded">
            {recetaIndicaciones || 'Sin indicaciones.'}
          </div>
        </div>

        <div className="mt-20 pt-8 flex justify-end">
          <div className="text-center w-64">
            <div className="border-t-2 border-gray-800 pt-2 font-bold">Firma y Timbre del Médico</div>
            <div className="text-sm text-gray-600 mt-1">Dr(a). RedNorte Médico</div>
          </div>
        </div>
      </div>

      {/* -------------------- FIN SECCION DE IMPRESION ---------------- */}

      {/* Header de la vista (NO IMPRIMIBLE) */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={onVolver}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Atención en Curso</h2>
            <p className="text-sm text-slate-500">Encounter ID: {encounterId}</p>
          </div>
        </div>
        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-blue-100">
          <Activity className="h-4 w-4" />
          Consulta Activa
        </div>
      </div>

      {/* Tarjeta de Información del Paciente (Mockeada por ahora) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
          <User className="h-6 w-6" />
        </div>
        <div>
          {/* 👇 Usamos las variables reales aquí */}
          <h3 className="font-semibold text-slate-900">{patientName || 'Cargando paciente...'}</h3>
          <p className="text-sm text-slate-500">
            RUT: {patientRut || 'N/A'} | Edad: {patientAge !== '--' ? `${patientAge} años` : '--'}
            </p>
        </div>
      </div>

      {/* Formulario Principal de la Ficha Clínica */}
      <form onSubmit={handleFinalizarAtencion} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Columna Izquierda: Motivo y Anamnesis */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-500" />
                Evolución Clínica
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de Consulta</label>
                  <input 
                    type="text" 
                    value={motivoConsulta}
                    onChange={(e) => setMotivoConsulta(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: Dolor abdominal de 3 días de evolución"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Anamnesis / Notas</label>
                  <textarea 
                    value={anamnesis}
                    onChange={(e) => setAnamnesis(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[150px] resize-y"
                    placeholder="Describe los síntomas, examen físico..."
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Diagnóstico y Cierre */}
          <div className="space-y-6">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-red-500" />
                Diagnóstico y Plan
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Diagnóstico Principal</label>
                  <input 
                    type="text" 
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: Gastritis aguda"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-emerald-500" />
                Receta Médica
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medicamentos (Rx)</label>
                  <textarea 
                    value={recetaMedicamentos}
                    onChange={(e) => setRecetaMedicamentos(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-y"
                    placeholder="Ej: Paracetamol 500mg, 1 comprimido cada 8 horas por 3 días."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Indicaciones Generales</label>
                  <textarea 
                    value={recetaIndicaciones}
                    onChange={(e) => setRecetaIndicaciones(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-y"
                    placeholder="Ej: Reposo en cama, abundante hidratación."
                  />
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row justify-end pt-4 gap-4">
              <button
                type="button"
                onClick={handleImprimirReceta}
                className="flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-xl font-medium border border-slate-300 hover:bg-slate-100 transition-colors"
              >
                <FileText className="h-5 w-5" />
                Imprimir Receta
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
              >
                {isSaving ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                {isSaving ? 'Guardando...' : 'Finalizar y Guardar'}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}