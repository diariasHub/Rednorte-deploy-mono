import { useState, useEffect } from 'react';
import { Stethoscope, Pill, MapPin, CheckCircle, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { toast } from 'sonner';
import { urgenciaService } from '../../../../services/urgencia.service';

export function NurseTreatmentsView() {
  const [tratamientosPendientes, setTratamientosPendientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showTratamientoModal, setShowTratamientoModal] = useState(false);
  const [selectedTratamiento, setSelectedTratamiento] = useState<any>(null);
  const [adminDetalles, setAdminDetalles] = useState({ dosis: '', via: '', tecnica: '', motivo: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTratamientos = async () => {
    setIsLoading(true);
    try {
      const res = await urgenciaService.getTratamientosPendientes();
      setTratamientosPendientes(Array.isArray(res) ? res : []);
    } catch (error) {
      toast.error('Error al cargar tratamientos pendientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTratamientos();
  }, []);

  const handleResolverTratamiento = async (estado: string) => {
    if (!selectedTratamiento) return;
    if (estado === 'administrado' && (!adminDetalles.dosis || !adminDetalles.via)) {
      toast.error('Debe completar Dosis y Vía de administración');
      return;
    }
    if (estado === 'rechazado' && !adminDetalles.motivo) {
      toast.error('Debe indicar el motivo del rechazo');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await urgenciaService.resolverTratamiento(selectedTratamiento.idRequest, {
        estado,
        ...adminDetalles
      });
      toast.success('Tratamiento actualizado', { description: res });
      setShowTratamientoModal(false);
      setAdminDetalles({ dosis: '', via: '', tecnica: '', motivo: '' });
      fetchTratamientos();
    } catch (error) {
      toast.error('Error al resolver tratamiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#004a87]">Lista de Tratamientos</h2>
          <p className="text-sm text-slate-500">Gestión de medicamentos y procedimientos indicados en box</p>
        </div>
        <button 
          onClick={fetchTratamientos}
          disabled={isLoading}
          className="px-4 py-2 bg-[#0096c7] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#0077b6] transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Actualizando...' : 'Actualizar Lista'}
        </button>
      </div>

      <Card className="shadow-lg border-none overflow-hidden">
        <CardHeader className="bg-white border-b py-5">
          <CardTitle className="text-lg font-bold text-[#004a87] flex items-center gap-2">
            <Pill className="h-5 w-5 text-[#00a7b1]" /> Tratamientos Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tratamientosPendientes.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center text-slate-500">
              <CheckCircle className="h-12 w-12 text-emerald-400 mb-3" />
              <p className="font-bold text-lg text-slate-700">No hay tratamientos pendientes</p>
              <p className="text-sm mt-1">Todos los pacientes han recibido sus indicaciones.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tratamientosPendientes.map((trat, idx) => (
                <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-lg text-slate-800">{trat.medicamento}</h3>
                      <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-200">
                        Pendiente
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 font-medium">Indicaciones: <span className="font-normal italic">{trat.indicaciones}</span></p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="h-3.5 w-3.5" /> 
                        <span className="truncate" title={trat.nombrePaciente}>{trat.nombrePaciente} ({trat.rut})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-red-500" /> 
                        <span className="font-bold text-slate-700">{trat.box}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Stethoscope className="h-3.5 w-3.5 text-blue-500" /> 
                        <span className="truncate" title={trat.medicoResponsable}>{trat.medicoResponsable}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedTratamiento(trat);
                      setAdminDetalles({ dosis: '', via: '', tecnica: '', motivo: '' });
                      setShowTratamientoModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm whitespace-nowrap self-start md:self-center"
                  >
                    Administrar
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL RESOLVER TRATAMIENTO */}
      {showTratamientoModal && selectedTratamiento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Pill className="h-5 w-5 text-emerald-600" /> Administrar Tratamiento
              </h3>
              <button onClick={() => setShowTratamientoModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-black text-blue-900 mb-2">{selectedTratamiento.medicamento}</h4>
                <p className="text-sm text-blue-800 mb-3"><span className="font-bold">Indicaciones:</span> {selectedTratamiento.indicaciones}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-blue-700">
                  <p><span className="font-bold">Paciente:</span> {selectedTratamiento.nombrePaciente}</p>
                  <p><span className="font-bold">RUT:</span> {selectedTratamiento.rut}</p>
                  <p><span className="font-bold">Box:</span> {selectedTratamiento.box}</p>
                  <p><span className="font-bold">Médico:</span> {selectedTratamiento.medicoResponsable}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Dosis a Administrar *</label>
                <input 
                  type="text" 
                  value={adminDetalles.dosis}
                  onChange={(e) => setAdminDetalles({...adminDetalles, dosis: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  placeholder="Ej: 1 ampolla (10mg)" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Vía *</label>
                  <input 
                    type="text" 
                    value={adminDetalles.via}
                    onChange={(e) => setAdminDetalles({...adminDetalles, via: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                    placeholder="Ej: Intravenosa" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Técnica</label>
                  <input 
                    type="text" 
                    value={adminDetalles.tecnica}
                    onChange={(e) => setAdminDetalles({...adminDetalles, tecnica: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                    placeholder="Ej: Bolo directo" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Motivo (Solo si se rechaza)</label>
                <input 
                  type="text" 
                  value={adminDetalles.motivo}
                  onChange={(e) => setAdminDetalles({...adminDetalles, motivo: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" 
                  placeholder="Ej: Paciente se rehúsa" 
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button 
                onClick={() => handleResolverTratamiento('rechazado')} 
                disabled={isSubmitting}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                Rechazar
              </button>
              <button 
                onClick={() => handleResolverTratamiento('administrado')} 
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Completar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
