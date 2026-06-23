import { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  MapPin, 
  AlertCircle, 
  ChevronRight,
  ClipboardList,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Patient, WaitingListEntry } from '../../../types/clinical';
import { urgenciaService } from '../../../../services/urgencia.service';
import { toast } from 'sonner';

export function DashboardNurse() {
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [triageId, setTriageId] = useState('');
  const [nivelTriage, setNivelTriage] = useState('1');
  const [fc, setFc] = useState('');
  const [sat, setSat] = useState('');
  const [temp, setTemp] = useState('');
  const [pa, setPa] = useState('');
  const [fr, setFr] = useState('');
  const [eva, setEva] = useState('');
  const [glasgow, setGlasgow] = useState('');
  const [glicemia, setGlicemia] = useState('');
  const [pacientesPendientes, setPacientesPendientes] = useState<any[]>([]);
  const [pacientesEnBox, setPacientesEnBox] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendientes = async () => {
    try {
      setIsLoading(true);
      const res = await urgenciaService.getPendientes();
      setPacientesPendientes(Array.isArray(res) ? res : []);
      
      // Fetch triaged to see occupied boxes
      const triagedRes = await urgenciaService.getTriaged();
      setPacientesEnBox(Array.isArray(triagedRes) ? triagedRes.filter((p: any) => p.location) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendientes();
  }, []);

  const handleTriage = async () => {
    try {
      const res = await urgenciaService.triage(triageId, { 
        categorizacion: nivelTriage,
        frecuenciaCardiaca: fc,
        saturacion: sat,
        temperatura: temp,
        presion: pa,
        frecuenciaRespiratoria: fr,
        eva: eva,
        glasgow: glasgow,
        glicemia: glicemia
      });
      toast.success('Triage completado', { description: res });
      setShowTriageModal(false);
      fetchPendientes();
    } catch (error) {
      toast.error('Error al procesar triage');
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-500 text-white';
      case 'media': return 'bg-amber-400 text-white';
      case 'baja': return 'bg-emerald-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'alta': return 'border-l-4 border-l-red-500';
      case 'media': return 'border-l-4 border-l-amber-400';
      case 'baja': return 'border-l-4 border-l-emerald-500';
      default: return 'border-l-4 border-l-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#004a87]">Dashboard Enfermería (Triage)</h2>
          <p className="text-sm text-slate-500">Gestión de flujo y priorización de pacientes</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-red-100 text-red-700 border-red-200">2 Alta Prioridad</Badge>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">2 Media</Badge>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">1 Baja</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Triage / Espera */}
        <Card className="lg:col-span-2 shadow-lg border-none overflow-hidden">
          <CardHeader className="bg-white border-b py-5">
            <CardTitle className="text-lg font-bold text-[#004a87] flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#00a7b1]" /> Pacientes en Espera de Categorización / Atención
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
              {pacientesPendientes.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {isLoading ? 'Cargando pacientes...' : 'No hay pacientes pendientes de triage.'}
                </div>
              ) : (
                pacientesPendientes.map((pac: any) => (
                  <div key={pac.id} className={`p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group border-l-4 border-l-slate-400`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold bg-slate-400 text-white`}>
                        {pac.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{pac.nombre}</p>
                        <p className="text-[11px] text-slate-500">{pac.rut} · {pac.motivo}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] flex items-center gap-1 text-slate-400 font-medium">
                            <Clock className="h-3 w-3" /> ID: {pac.id}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setTriageId(pac.id);
                        setShowTriageModal(true);
                      }}
                      className="bg-slate-100 hover:bg-[#004a87] hover:text-white p-2 rounded-lg transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
          </CardContent>
        </Card>

        {/* Panel Lateral: Box y Estado */}
        <div className="space-y-6">
          <Card className="shadow-md border-none">
            <CardHeader className="border-b">
              <CardTitle className="text-base font-bold text-[#004a87] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#00a7b1]" /> Estado de Boxes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2">
                {['Box 1', 'Box 2', 'Box 3', 'Reanimación', 'Sala de Observación'].map(boxName => {
                  const paciente = pacientesEnBox.find(p => p.location === boxName);
                  const isOccupied = !!paciente;
                  return (
                    <div key={boxName} className={`p-3 rounded-lg border text-center transition-all ${isOccupied ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                      <p className="text-xs font-bold">{boxName}</p>
                      <p className="text-[10px] mt-1">{isOccupied ? `Ocupado (${paciente.nombre})` : 'Disponible'}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg border-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-8 w-8 text-white/80" />
                <div>
                  <h3 className="font-bold text-sm">Alertas Médicas</h3>
                  <p className="text-[10px] text-amber-100">1 Paciente crítico detectado</p>
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg text-xs leading-relaxed italic">
                "Paciente en Box 2 requiere validación de signos vitales urgente."
              </div>
            </CardContent>
          </Card>

          <button 
            onClick={() => setShowTriageModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#004a87] hover:bg-[#003561] text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all"
          >
            <Stethoscope className="h-4 w-4" /> Categorizar Paciente
          </button>
        </div>
      </div>

      {showTriageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl border-none animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800">Evaluación Triage</CardTitle>
              <button onClick={() => setShowTriageModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Encuentro</label>
                <input 
                  type="text" 
                  value={triageId}
                  onChange={(e) => setTriageId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#f4a261]/20 focus:border-[#f4a261] outline-none" 
                  placeholder="ID generado en recepción" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Gravedad (ESI)</label>
                <select 
                  value={nivelTriage}
                  onChange={(e) => setNivelTriage(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#f4a261]/20 focus:border-[#f4a261] outline-none"
                >
                  <option value="1">ESI 1 - Riesgo Vital Inmediato</option>
                  <option value="2">ESI 2 - Riesgo Vital Alto</option>
                  <option value="3">ESI 3 - Mediana Gravedad</option>
                  <option value="4">ESI 4 - Riesgo Vital Bajo</option>
                  <option value="5">ESI 5 - Atención General</option>
                </select>
              </div>

              {/* Nuevos campos de Signos Vitales (Opcionales) */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-800 mb-2">Control de Signos Vitales (Opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 uppercase">Frecuencia Cardíaca</label>
                    <input type="text" value={fc} onChange={e => setFc(e.target.value)} placeholder="Ej: 80 lpm" className="w-full border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-[#f4a261]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 uppercase">Saturación (O2)</label>
                    <input type="text" value={sat} onChange={e => setSat(e.target.value)} placeholder="Ej: 98%" className="w-full border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-[#f4a261]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 uppercase">Temperatura</label>
                    <input type="text" value={temp} onChange={e => setTemp(e.target.value)} placeholder="Ej: 36.5°C" className="w-full border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-[#f4a261]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 uppercase">Presión Arterial</label>
                    <input type="text" value={pa} onChange={e => setPa(e.target.value)} placeholder="Ej: 120/80" className="w-full border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-[#f4a261]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 uppercase">Frecuencia Resp.</label>
                    <input type="text" value={fr} onChange={e => setFr(e.target.value)} placeholder="Ej: 16 rpm" className="w-full border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-[#f4a261]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 uppercase">Glicemia</label>
                    <input type="text" value={glicemia} onChange={e => setGlicemia(e.target.value)} placeholder="Ej: 90 mg/dl" className="w-full border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-[#f4a261]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 uppercase">Escala Dolor (EVA)</label>
                    <input type="text" value={eva} onChange={e => setEva(e.target.value)} placeholder="Ej: 4/10" className="w-full border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-[#f4a261]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 uppercase">Escala Glasgow</label>
                    <input type="text" value={glasgow} onChange={e => setGlasgow(e.target.value)} placeholder="Ej: 15" className="w-full border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-[#f4a261]" />
                  </div>
                </div>
              </div>

              <button onClick={handleTriage} className="w-full bg-[#f4a261] hover:bg-[#e76f51] text-white font-bold py-3 rounded-lg transition-colors mt-4">
                Guardar Triage
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
