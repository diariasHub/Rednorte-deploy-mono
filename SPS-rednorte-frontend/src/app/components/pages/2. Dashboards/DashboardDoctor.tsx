import { useState, useEffect } from 'react';
import { 
  Calendar, User, FileText, Clock, ChevronRight, History, Stethoscope, Loader2, MoreVertical, AlertCircle, MapPin, CheckCircle, Pill
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { urgenciaService } from '../../../../services/urgencia.service';
import { toast } from 'sonner';

// Interfaz del DTO que entregará tu API Gateway
interface AppointmentDTO {
  id: string;
  patientId: string;
  patientName: string;
  patientRut: string;
  patientAge: string;
  start: string; 
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow'; 
}

interface DashboardDoctorProps {
  onIrAAtencion: (encounterId: string, appointmentId: string, patientId: string, patientName: string, patientRut: string, patientAge: string) => void;
  mode?: 'urgencias' | 'agenda';
}

export function DashboardDoctor({ onIrAAtencion, mode = 'urgencias' }: DashboardDoctorProps) {
  const drId = 'medico-1101'; 
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [myAgenda, setMyAgenda] = useState<AppointmentDTO[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [errorAgenda, setErrorAgenda] = useState<string | null>(null);
  const [procesandoCitaId, setProcesandoCitaId] = useState<string | null>(null);
  const [showAltaModal, setShowAltaModal] = useState(false);
  const [altaId, setAltaId] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [fichaActual, setFichaActual] = useState<any>(null);
  const [isSubmittingAlta, setIsSubmittingAlta] = useState(false);
  const [isSubmittingBox, setIsSubmittingBox] = useState(false);

  const handleAltaUrgencia = async (hospitalizacion: boolean) => {
    setIsSubmittingAlta(true);
    try {
      const res = await urgenciaService.alta(altaId, diagnostico, hospitalizacion);
      toast.success('Paciente dado de alta', { description: res });
      setShowAltaModal(false);
      setDiagnostico('');
      fetchUrgencias();
    } catch (error) {
      toast.error('Error al dar de alta al paciente');
    } finally {
      setIsSubmittingAlta(false);
    }
  };

  const openAltaModal = async (id: string) => {
    setAltaId(id);
    setFichaActual(null);
    setShowAltaModal(true);
    try {
      const f = await urgenciaService.getFicha(id);
      setFichaActual(f);
    } catch (e) {
      console.error(e);
    }
  };

  const [urgenciasTriaged, setUrgenciasTriaged] = useState<any[]>([]);
  const [tratamientosPendientes, setTratamientosPendientes] = useState<any[]>([]);
  const [loadingUrgencias, setLoadingUrgencias] = useState(true);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [selectedUrgenciaId, setSelectedUrgenciaId] = useState('');
  const [selectedBox, setSelectedBox] = useState('Box 1');

  // Estados para Asignar Tratamiento
  const [showTratamientoModal, setShowTratamientoModal] = useState(false);
  const [tratamientoIdEncuentro, setTratamientoIdEncuentro] = useState('');
  const [medicamento, setMedicamento] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [isSubmittingTratamiento, setIsSubmittingTratamiento] = useState(false);

  const fetchUrgencias = async () => {
    setLoadingUrgencias(true);
    try {
      const [resUrgencias, resTratamientos] = await Promise.all([
        urgenciaService.getTriaged(),
        urgenciaService.getTratamientosPendientes()
      ]);
      setUrgenciasTriaged(Array.isArray(resUrgencias) ? resUrgencias : []);
      setTratamientosPendientes(Array.isArray(resTratamientos) ? resTratamientos : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUrgencias(false);
    }
  };

  const handleAsignarTratamientoClick = (id: string) => {
    setTratamientoIdEncuentro(id);
    setMedicamento('');
    setIndicaciones('');
    setShowTratamientoModal(true);
  };

  const handleIndicarTratamiento = async () => {
    if (!medicamento || !indicaciones) {
      toast.error('Debe ingresar el medicamento y las indicaciones');
      return;
    }
    setIsSubmittingTratamiento(true);
    try {
      await urgenciaService.indicarTratamiento(tratamientoIdEncuentro, medicamento, indicaciones);
      toast.success('Tratamiento asignado correctamente. Enfermería ha sido notificada.');
      setShowTratamientoModal(false);
      fetchUrgencias(); // Recargar para bloquear el botón de alta
    } catch (e) {
      toast.error('Error al asignar tratamiento');
    } finally {
      setIsSubmittingTratamiento(false);
    }
  };

  const handleAsignarBoxClick = (id: string) => {
    setSelectedUrgenciaId(id);
    setShowBoxModal(true);
  };

  const handleAsignarBox = async () => {
    setIsSubmittingBox(true);
    try {
      await urgenciaService.asignarBox(selectedUrgenciaId, selectedBox);
      toast.success('Box asignado con éxito');
      setShowBoxModal(false);
      fetchUrgencias();
    } catch (e) {
      toast.error('Error al asignar Box');
    } finally {
      setIsSubmittingBox(false);
    }
  };

  const fetchAgenda = async () => {
    setLoadingAgenda(true);
    try {
      const response = await fetch(`/agendas/appointments/doctor/${drId}?date=${selectedDate}`);
      const data = await response.json();
      setMyAgenda(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAgenda(false);
    }
  };

  useEffect(() => {
    if (mode === 'agenda') {
      fetchAgenda();
    } else {
      fetchUrgencias();
    }
  }, [drId, selectedDate, mode]);

  const handleCambiarEstado = async (appointmentId: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/agendas/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nuevoEstado })
      });

      if (!response.ok) throw new Error("Error al actualizar la cita");
      
      setMyAgenda(prev => prev.map(cita => 
        cita.id === appointmentId ? { ...cita, status: nuevoEstado as AppointmentDTO['status'] } : cita
      ));

    } catch (error) {
      console.error(error);
      alert("No se pudo modificar el estado de la cita en el servidor.");
      fetchAgenda(); 
    }
  };

  if (mode === 'agenda') {
    const confirmedAgenda = myAgenda.filter(c => c.status === 'booked' || c.status === 'arrived');
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-[#004a87] flex items-center gap-2">
              <Calendar className="h-6 w-6 text-[#00a7b1]" />
              Mi Agenda Médica
            </h2>
            <p className="text-sm text-slate-500 mt-1">Pacientes agendados y confirmados para atención en box</p>
          </div>
          <div className="flex gap-3">
            <input 
              type="date" 
              className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-[#00a7b1]/20 outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <Card className="shadow-lg border-none overflow-hidden">
          <CardContent className="p-0">
            {loadingAgenda ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#00a7b1] mb-2" />
                Cargando agenda...
              </div>
            ) : confirmedAgenda.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-lg font-bold text-slate-700">No tienes citas agendadas para este día.</p>
                <p className="text-sm">Selecciona otra fecha para ver tu programación.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {confirmedAgenda.map((cita) => {
                  const citaDate = new Date(cita.start);
                  return (
                    <div key={cita.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-[#004a87] text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shadow-sm">
                          <span className="text-xs font-normal opacity-80">Hora</span>
                          <span className="text-lg">
                            {citaDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg text-slate-800">{cita.patientName}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="font-medium text-slate-700">{cita.patientRut}</span>
                            <span>·</span>
                            <span>{cita.patientAge} años</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-medium text-[#00a7b1] mt-1">
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Centro Médico</span>
                            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3.5 w-3.5" /> Confirmado</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onIrAAtencion(cita.id, cita.id, cita.patientId, cita.patientName, cita.patientRut, cita.patientAge)}
                          className="bg-[#0096c7] hover:bg-[#0077b6] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
                        >
                          Atender
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const iniciarAtencion = async (appointmentId: string, patientId: string, patientName: string, patientRut: string, patientAge: string) => {
    setProcesandoCitaId(appointmentId);
    try {
      const response = await fetch(`/api/v1/encounters/start/${appointmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error("Error al iniciar el encuentro clínico");

      const encounterData = await response.json();
      // 👇 2. Pásale los 3 IDs a la vista principal
    onIrAAtencion(encounterData.id, appointmentId, patientId, patientName, patientRut, patientAge);      
    } catch (error) {
      console.error(error);
      alert("Hubo un problema al crear el Encounter en FHIR.");
    } finally {
      setProcesandoCitaId(null);
    }
  };

  // Helper de Badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'arrived': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">En Sala</Badge>;
      case 'booked': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Reservada</Badge>;
      case 'fulfilled': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Atendido</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelada</Badge>;
      case 'noshow': return <Badge className="bg-gray-100 text-gray-800 border-gray-200">No asiste</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-800">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg border-none overflow-hidden">
          <CardHeader className="bg-white border-b py-5 flex flex-row justify-between items-center">
            <CardTitle className="text-lg font-bold text-[#004a87] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#00a7b1]" /> 
              {/* El título cambia dinámicamente si no es la fecha de hoy */}
              Agenda de Pacientes {selectedDate === todayStr ? '- Hoy' : ''}
            </CardTitle>
            
            {/* Contenedor para el input y el botón */}
            <div className="flex items-center gap-4">
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#00a7b1] focus:ring-1 focus:ring-[#00a7b1] transition-all cursor-pointer hover:bg-slate-100"
              />
              <button 
                onClick={fetchAgenda} 
                className="text-xs text-slate-500 hover:text-[#004a87] font-medium transition-colors"
              >
                Actualizar
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAgenda ? (
              <div className="p-10 flex flex-col justify-center items-center text-slate-500 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#00a7b1]"/> 
                <span className="text-sm font-medium">Conectando con servidor FHIR...</span>
              </div>
            ) : errorAgenda ? (
              <div className="p-8 flex flex-col justify-center items-center text-red-500 gap-2">
                <AlertCircle className="h-6 w-6" />
                <span className="text-sm">{errorAgenda}</span>
              </div>
            ) : myAgenda.length === 0 ? (
               <div className="p-10 text-center text-slate-500 text-sm">
                 No se encontraron citas agendadas para hoy.
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b">
                    <tr>
                      <th className="px-6 py-4">Paciente</th>
                      <th className="px-6 py-4">Hora</th>
                      <th className="px-6 py-4">Estado FHIR</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myAgenda.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-[#00a7b1]/10 text-[#00a7b1] flex items-center justify-center font-bold text-sm">
                                {a.patientName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{a.patientName}</p>
                                <p className="text-[11px] text-slate-500">RUT: {a.patientRut}</p>
                              </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                            <Clock className="h-4 w-4 text-[#00a7b1]" /> 
                            {new Date(a.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(a.status)}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                          
                          {a.status === 'booked' && (
                            <button 
                              onClick={() => handleCambiarEstado(a.id, 'arrived')}
                              className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-md transition-colors"
                            >
                              Marcar Llegada
                            </button>
                          )}

                          {(a.status === 'booked' || a.status === 'arrived') && (
                            <button 
                              onClick={() => iniciarAtencion(a.id, a.patientId, a.patientName, a.patientRut, a.patientAge)} // <-- ENVIAMOS TODO
                              disabled={procesandoCitaId === a.id}
                              className="text-xs font-bold text-white bg-[#004a87] hover:bg-[#003666] px-4 py-1.5 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              {procesandoCitaId === a.id ? (
                                <><Loader2 className="h-3 w-3 animate-spin"/> Creando...</>
                              ) : (
                                <>Atender <ChevronRight className="h-3 w-3" /></>
                              )}
                            </button>
                          )}
                          
                          {(a.status === 'booked' || a.status === 'arrived') && (
                            <div className="relative group/menu">
                              <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block w-36 bg-white border border-slate-200 shadow-xl rounded-lg z-10 overflow-hidden">
                                <button 
                                  onClick={() => handleCambiarEstado(a.id, 'cancelled')}
                                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  Cancelar Cita
                                </button>
                                <button 
                                  onClick={() => handleCambiarEstado(a.id, 'noshow')}
                                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 border-t border-slate-100"
                                >
                                  No se presentó
                                </button>
                              </div>
                            </div>
                          )}

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Panel de Urgencias */}
        <div className="space-y-6">
          <Card className="shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-white border-b py-5">
              <CardTitle className="text-lg font-bold text-[#e63946] flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Urgencias Categorizadas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {loadingUrgencias ? (
                  <div className="p-6 text-center text-slate-500">Cargando urgencias...</div>
                ) : urgenciasTriaged.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">No hay pacientes esperando atención médica.</div>
                ) : (
                  urgenciasTriaged.map((pac: any) => (
                    <div key={pac.id} className="p-4 hover:bg-slate-50 transition-colors border-l-4 border-l-red-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{pac.nombre}</p>
                          <p className="text-[11px] text-slate-500">{pac.rut}</p>
                          <p className="text-[11px] font-semibold text-[#004a87] mt-1">
                            {pac.location ? `Ubicación: ${pac.location}` : 'Esperando Box'}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-700">ESI {pac.categorizacion}</Badge>
                      </div>
                      <div className="flex flex-col gap-2 mt-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleAsignarBoxClick(pac.id)}
                            disabled={!!pac.location}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs py-2 rounded font-medium flex items-center justify-center gap-1"
                          >
                            <MapPin className="h-3 w-3" /> {pac.location ? 'Box Asignado' : 'Asignar Box'}
                          </button>
                          <button 
                            onClick={() => handleAsignarTratamientoClick(pac.id)}
                            disabled={!pac.location}
                            className="flex-1 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 text-amber-700 text-xs py-2 rounded font-medium flex items-center justify-center gap-1"
                          >
                            <Pill className="h-3 w-3" /> Asignar Tratam.
                          </button>
                        </div>
                        <button 
                          onClick={() => openAltaModal(pac.id)}
                          disabled={tratamientosPendientes.some(t => t.idEncuentro === pac.id)}
                          className="w-full bg-[#004a87] hover:bg-[#003561] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs py-2 rounded font-medium flex items-center justify-center gap-1 transition-colors"
                          title={tratamientosPendientes.some(t => t.idEncuentro === pac.id) ? "Tiene tratamientos pendientes en enfermería" : ""}
                        >
                          <CheckCircle className="h-3 w-3" /> {tratamientosPendientes.some(t => t.idEncuentro === pac.id) ? 'Tratamiento Pendiente' : 'Dar Alta'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showAltaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl border-none animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#004a87]" /> Atención y Alta
              </CardTitle>
              <button onClick={() => setShowAltaModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              
              {fichaActual && fichaActual.signosVitales && Object.keys(fichaActual.signosVitales).length > 0 && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-[#004a87] mb-2">Signos Vitales (Desde Triage)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(fichaActual.signosVitales).map(([k, v]) => (
                      <div key={k} className="text-[11px]">
                        <span className="font-semibold text-slate-500 uppercase">{k}:</span> {v as string}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diagnóstico Final</label>
                <textarea 
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#004a87]/20 focus:border-[#004a87] outline-none" 
                  rows={4} 
                  placeholder="Ej: Paciente estabilizado, se indican analgésicos..." 
                />
              </div>
              
              <div className="flex gap-3 mt-4">
                <button onClick={() => handleAltaUrgencia(false)} disabled={isSubmittingAlta} className="flex-1 bg-[#00a7b1] hover:bg-[#008f98] disabled:opacity-70 text-white font-bold py-2.5 rounded-lg transition-colors text-xs flex items-center justify-center gap-2">
                  {isSubmittingAlta && <Loader2 className="w-4 h-4 animate-spin"/>} Alta a Domicilio
                </button>
                <button onClick={() => handleAltaUrgencia(true)} disabled={isSubmittingAlta} className="flex-1 bg-[#e63946] hover:bg-[#c9323d] disabled:opacity-70 text-white font-bold py-2.5 rounded-lg transition-colors text-xs flex items-center justify-center gap-2">
                  {isSubmittingAlta && <Loader2 className="w-4 h-4 animate-spin"/>} Alta c/ Hospitalización
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showBoxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm shadow-xl border-none animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#004a87]" /> Asignar Box
              </CardTitle>
              <button onClick={() => setShowBoxModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Box</label>
                <select 
                  value={selectedBox}
                  onChange={(e) => setSelectedBox(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#004a87]/20 focus:border-[#004a87] outline-none"
                >
                  <option value="Box 1">Box 1</option>
                  <option value="Box 2">Box 2</option>
                  <option value="Box 3">Box 3</option>
                  <option value="Box 4">Box 4</option>
                  <option value="Box 5">Box 5</option>
                  <option value="Box 6">Box 6</option>
                  <option value="Box 7">Box 7</option>
                  <option value="Box 8">Box 8</option>
                  <option value="Reanimación">Reanimación</option>
                  <option value="Box Dental">Box Dental</option>
                </select>
              </div>
              <button onClick={handleAsignarBox} disabled={isSubmittingBox} className="w-full bg-[#004a87] hover:bg-[#003561] disabled:opacity-70 text-white font-bold py-3 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2">
                {isSubmittingBox && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSubmittingBox ? 'Asignando...' : 'Confirmar Asignación'}
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {showTratamientoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl border-none animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-amber-700 flex items-center gap-2">
                <Pill className="h-5 w-5" /> Asignar Tratamiento
              </CardTitle>
              <button onClick={() => setShowTratamientoModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medicamento / Procedimiento</label>
                <input 
                  type="text"
                  value={medicamento}
                  onChange={(e) => setMedicamento(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  placeholder="Ej: Suero Fisiológico 500ml"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Indicaciones (Dosis, Vía, Frecuencia)</label>
                <textarea 
                  value={indicaciones}
                  onChange={(e) => setIndicaciones(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  rows={3}
                  placeholder="Ej: Administrar vía endovenosa a goteo rápido."
                />
              </div>
              <button onClick={handleIndicarTratamiento} disabled={isSubmittingTratamiento} className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-70 text-white font-bold py-3 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2">
                {isSubmittingTratamiento && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSubmittingTratamiento ? 'Notificando Enfermería...' : 'Indicar Tratamiento'}
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}