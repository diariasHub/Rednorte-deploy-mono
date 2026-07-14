import { 
  Users, Activity, Clock, CheckCircle, Search, FileText, Stethoscope, Bed, HeartPulse, Calendar, PlusCircle, RefreshCw, Loader2, XCircle, Edit
} from 'lucide-react';
import { appointmentService } from '../../../../services/appointment.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useState, useEffect } from 'react';
import { urgenciaService } from '../../../../services/urgencia.service';
import { appointmentsRemote } from '../../../../remotes/appointments.remote';
import { toast } from 'sonner';

interface DashboardAdminProps {
  onReserva?: () => void;
}

export function DashboardAdmin({ onReserva }: DashboardAdminProps) {
  const [loading, setLoading] = useState(false);
  const [urgenciasPendientes, setUrgenciasPendientes] = useState<any[]>([]);
  const [urgenciasTriaged, setUrgenciasTriaged] = useState<any[]>([]);
  const [urgenciasAltas, setUrgenciasAltas] = useState<any[]>([]);
  const [urgenciasRechazadas, setUrgenciasRechazadas] = useState<any[]>([]);
  const [agendasMedicas, setAgendasMedicas] = useState<any[]>([]);
  
  // Modals
  const [showEpicrisisModal, setShowEpicrisisModal] = useState(false);
  const [selectedFichaEpicrisis, setSelectedFichaEpicrisis] = useState<any>(null);
  
  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false);
  const [ingresoRut, setIngresoRut] = useState('');
  
  // Citas Medicas Modals
  const [idToCancelCita, setIdToCancelCita] = useState<string | null>(null);
  const [showReasignarModal, setShowReasignarModal] = useState(false);
  const [reasignarCitaId, setReasignarCitaId] = useState<string | null>(null);
  const [reasignarFecha, setReasignarFecha] = useState('');
  const [reasignarHora, setReasignarHora] = useState('09:00');

  const formatRut = (value: string) => {
    let cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleaned.length === 0) return '';
    let result = cleaned.slice(-1);
    let body = cleaned.slice(0, -1);
    if (body.length > 0) {
      body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      result = body + '-' + result;
    }
    return result;
  };
  const [ingresoNombre, setIngresoNombre] = useState('');
  const [ingresoMotivo, setIngresoMotivo] = useState('');

  // Search
  const [searchRut, setSearchRut] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendientes, triaged, altas, rechazadas, agendas] = await Promise.all([
        urgenciaService.getPendientes(),
        urgenciaService.getTriaged(),
        urgenciaService.getAltas(),
        urgenciaService.getRechazadas(),
        appointmentsRemote.getAll()
      ]);

      setUrgenciasPendientes(pendientes || []);
      setUrgenciasTriaged(triaged || []);
      setUrgenciasAltas(altas || []);
      setUrgenciasRechazadas(rechazadas || []);
      
      const arrAgendas = Array.isArray(agendas) ? agendas : (agendas?.entry ? agendas.entry.map((e: any) => e.resource) : []);
      // No mostramos las canceladas en la vista principal
      setAgendasMedicas(arrAgendas.filter((c: any) => c.status !== 'cancelled'));
      
    } catch (error) {
      console.error("Error cargando datos del administrador", error);
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const traducirEstado = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'booked': return { texto: 'Confirmada', color: 'bg-emerald-100 text-emerald-700' };
      case 'pending': return { texto: 'Por Confirmar', color: 'bg-slate-200 text-slate-600' };
      case 'cancelled': return { texto: 'Cancelada', color: 'bg-red-100 text-red-700' };
      case 'arrived': return { texto: 'En Sala de Espera', color: 'bg-blue-100 text-blue-700' };
      case 'fulfilled': return { texto: 'Finalizada', color: 'bg-indigo-100 text-indigo-700' };
      case 'noshow': return { texto: 'No se Presentó', color: 'bg-orange-100 text-orange-700' };
      default: return { texto: estado || 'Por Confirmar', color: 'bg-slate-200 text-slate-600' };
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto update every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!searchRut) return;
    setLoading(true);
    try {
      const cleanSearch = searchRut.replace(/[^0-9kK]/gi, '').toUpperCase();
      const pacienteEnAlta = urgenciasAltas.find(a => {
        const cleanRut = a.rut ? a.rut.replace(/[^0-9kK]/gi, '').toUpperCase() : '';
        return cleanRut === cleanSearch || a.nombre.toLowerCase().includes(searchRut.toLowerCase());
      });

      if (pacienteEnAlta) {
        const ficha = await urgenciaService.getFicha(pacienteEnAlta.id);
        setSelectedFichaEpicrisis({ ...pacienteEnAlta, ...ficha });
        setShowEpicrisisModal(true);
      } else {
        toast.error("No se encontraron registros de alta para este paciente reciente.");
      }
    } catch(e) {
      toast.error("Error buscando historial");
    } finally {
      setLoading(false);
    }
  };

  const handleIngresoUrgencia = async () => {
    if (!ingresoRut || !ingresoMotivo) {
      toast.error('RUT y Motivo son obligatorios');
      return;
    }

    const cleanedRutForCheck = ingresoRut.replace(/[^0-9kK]/gi, '').toUpperCase();
    const isPending = urgenciasPendientes.some(p => p.rut.replace(/[^0-9kK]/gi, '').toUpperCase() === cleanedRutForCheck);
    const isTriaged = urgenciasTriaged.some(p => p.rut.replace(/[^0-9kK]/gi, '').toUpperCase() === cleanedRutForCheck);
    
    if (isPending || isTriaged) {
      toast.error('El paciente ya se encuentra en atención activa en Urgencias.');
      return;
    }

    setLoading(true);
    try {
      await urgenciaService.ingreso(ingresoRut, ingresoMotivo, ingresoNombre);
      toast.success('Ingreso a urgencias registrado exitosamente');
      setIsIngresoModalOpen(false);
      setIngresoRut(''); setIngresoNombre(''); setIngresoMotivo('');
      fetchData();
    } catch(e) {
      toast.error('Error al ingresar urgencia');
    } finally {
      setLoading(false);
    }
  };

  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const handleCancelarAtencion = (idEncuentro: string) => {
    setIdToDelete(idEncuentro);
  };

  const confirmCancelarAtencion = async () => {
    if (!idToDelete) return;
    setLoading(true);
    try {
      await urgenciaService.rechazar(idToDelete, "ADMIN-CANCEL");
      toast.success("Atención cancelada correctamente");
      setIdToDelete(null);
      fetchData();
    } catch(e) {
      toast.error("Error al cancelar atención");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarCita = async () => {
    if (!idToCancelCita) return;
    setLoading(true);
    try {
      await appointmentService.cancel(idToCancelCita);
      toast.success("Cita cancelada correctamente");
      setIdToCancelCita(null);
      fetchData();
    } catch (e) {
      toast.error("Error al cancelar la cita");
    } finally {
      setLoading(false);
    }
  };

  const handleReasignarCita = async () => {
    if (!reasignarCitaId || !reasignarFecha || !reasignarHora) {
      toast.error("Por favor complete fecha y hora");
      return;
    }
    setLoading(true);
    try {
      await appointmentService.updateTime(reasignarCitaId, reasignarFecha, reasignarHora);
      toast.success("Cita reasignada correctamente");
      setShowReasignarModal(false);
      fetchData();
    } catch (e) {
      toast.error("Error al reasignar la cita");
    } finally {
      setLoading(false);
    }
  };

  // Cálculos de Mocks y Estado
  const boxTotales = 10;
  
  // Separar triagados en los que tienen Box y los que no
  // Asumimos que el backend puede mandar 'box' vacío si aún no está asignado.
  // Si no manda box, simulamos para demostración: 
  const enEsperaDeBox = urgenciasTriaged.filter(p => !p.box || p.box === 'Sin asignar');
  const enAtencion = urgenciasTriaged.filter(p => p.box && p.box !== 'Sin asignar');
  
  const boxesOcupados = enAtencion.length;
  const boxesDisponibles = boxTotales - boxesOcupados;

  const personalTurno = {
    medicos: ["Dr. Juan Pérez", "Dra. María Gómez", "Dr. Carlos Silva"],
    enfermeros: ["Enf. Ana Rojas", "Enf. Luis Soto"]
  };

  return (
    <div className="space-y-6">
      
      {/* Botones de Acción Global */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Panel de Recepción y Control</h2>
          <p className="text-slate-500 text-sm">Gestiona ingresos, agendas y boxes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setIsIngresoModalOpen(true)} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition">
            <Activity className="h-4 w-4" /> Registrar Urgencia
          </button>
          {onReserva && (
            <button onClick={onReserva} className="flex items-center gap-2 bg-[#0096c7] hover:bg-[#0077b6] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition">
              <Calendar className="h-4 w-4" /> Agendar Cita Médica
            </button>
          )}
          <button onClick={fetchData} className="text-slate-400 hover:text-[#004a87] p-2 border border-slate-200 rounded-lg transition" title="Refrescar Datos">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tarjetas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <div className="text-2xl font-black text-blue-900">{urgenciasPendientes.length}</div>
            <div className="text-xs font-semibold text-blue-700 uppercase">Espera s/Triage</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Activity className="h-8 w-8 text-purple-600 mb-2" />
            <div className="text-2xl font-black text-purple-900">{enEsperaDeBox.length}</div>
            <div className="text-xs font-semibold text-purple-700 uppercase">Espera de Box</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-none shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Bed className="h-8 w-8 text-emerald-600 mb-2" />
            <div className="text-2xl font-black text-emerald-900">{boxesDisponibles}</div>
            <div className="text-xs font-semibold text-emerald-700 uppercase">Boxes Libres</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-none shadow-sm">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Calendar className="h-8 w-8 text-amber-600 mb-2" />
            <div className="text-2xl font-black text-amber-900">{agendasMedicas.length}</div>
            <div className="text-xs font-semibold text-amber-700 uppercase">Citas Agendadas</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Urgencias (Triage y Atención) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sin Triage */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" /> Sala de Espera (Sin Triage)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[250px] overflow-y-auto">
                {urgenciasPendientes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No hay pacientes esperando triage.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {urgenciasPendientes.map((p, i) => (
                      <div key={i} className="p-3 hover:bg-slate-50 transition flex justify-between items-center">
                        <div>
                          <div className="font-bold text-sm text-slate-800">{p.nombre}</div>
                          <div className="text-xs text-slate-500">RUT: {p.rut}</div>
                        </div>
                        <button onClick={() => handleCancelarAtencion(p.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors" title="Cancelar Atención">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Con Triage (Espera Box) */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" /> Triagados (Espera Box)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[250px] overflow-y-auto">
                {enEsperaDeBox.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No hay pacientes en espera de box.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {enEsperaDeBox.map((p, i) => (
                      <div key={i} className="p-3 hover:bg-slate-50 transition flex justify-between items-center">
                        <div>
                          <div className="font-bold text-sm text-slate-800">{p.nombre}</div>
                          <div className="text-xs text-slate-500">RUT: {p.rut}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 text-red-700 font-black text-xs px-2 py-1 rounded">ESI {p.categorizacion}</div>
                          <button onClick={() => handleCancelarAtencion(p.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors" title="Cancelar Atención">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pacientes en Box (En Atención) */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Bed className="h-4 w-4 text-blue-600" /> Pacientes en Atención (En Box)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
              {enAtencion.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No hay pacientes siendo atendidos en boxes actualmente.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {enAtencion.map((p, i) => {
                    const docAsignado = personalTurno.medicos[i % personalTurno.medicos.length];
                    const colorEsi = p.categorizacion === '1' ? 'bg-red-600 text-white' : p.categorizacion === '2' ? 'bg-orange-500 text-white' : p.categorizacion === '3' ? 'bg-yellow-400 text-slate-800' : 'bg-green-500 text-white';
                    
                    return (
                    <div key={i} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 flex items-center justify-center font-black text-xs rounded-full shadow-sm ${colorEsi}`}>
                          ESI {p.categorizacion}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-800">{p.nombre}</div>
                          <div className="text-xs text-slate-500 font-mono">RUT: {p.rut}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="font-black text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded inline-block uppercase tracking-wider">BOX: {p.box}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 justify-end"><Stethoscope className="w-3 h-3"/> {docAsignado}</div>
                        </div>
                        <button onClick={() => handleCancelarAtencion(p.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors" title="Cancelar Atención">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agendas Médicas (Citas Planificadas) */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-amber-500">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" /> Agendas Médicas (Citas Planificadas)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
              {agendasMedicas.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No hay citas médicas agendadas en el sistema.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {agendasMedicas.map((cita, idx) => {
                    // Soporte para ambos formatos (DTO de backend o FHIR directo)
                    const patRef = cita.patientName || cita.participant?.find((p:any) => p.actor?.reference?.startsWith('Patient'))?.actor?.display || 'Paciente Desconocido';
                    const pracRef = cita.doctorName || cita.participant?.find((p:any) => p.actor?.reference?.startsWith('Practitioner'))?.actor?.display || 'Médico Asignado';
                    const fechaObj = new Date(cita.start);
                    const estadoObj = traducirEstado(cita.status);
                    
                    return (
                    <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                           <div className="font-bold text-sm text-slate-800">{pracRef}</div>
                           <div className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${estadoObj.color}`}>
                             {estadoObj.texto}
                           </div>
                        </div>
                        <div className="text-xs text-slate-600 font-medium mt-1">Cita con: {patRef}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex flex-col sm:flex-row sm:gap-2">
                          <span>Tel: {cita.patientPhone || "+56 9 0000 0000"}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Correo: {cita.patientEmail || `${patRef.split(' ')[0].toLowerCase()}@correo.cl`}</span>
                        </div>
                      </div>
                      <div className="text-left md:text-right mt-2 md:mt-0">
                        <div className="font-bold text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1.5 rounded inline-block shadow-sm">
                          {fechaObj.toLocaleDateString()} - {fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="flex gap-2 mt-2 justify-end">
                          <button 
                            onClick={() => {
                              setReasignarCitaId(cita.id);
                              setReasignarFecha(fechaObj.toISOString().split('T')[0]);
                              setReasignarHora(fechaObj.toTimeString().slice(0, 5));
                              setShowReasignarModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors" 
                            title="Reasignar Cita"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setIdToCancelCita(cita.id)} 
                            className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors" 
                            title="Cancelar Cita"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
          
        </div>

        {/* Columna Derecha: Boxes, Personal y Altas */}
        <div className="space-y-6">
          {/* Ocupación Boxes */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Bed className="h-4 w-4 text-[#004a87]" /> Estado de Boxes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Atención General (8)</span>
                  <span>{Math.min(8, boxesOcupados)} ocupados</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${(Math.min(8, boxesOcupados)/8)*100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Reanimación (1)</span>
                  <span>{boxesOcupados > 8 ? 1 : 0} ocupados</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${boxesOcupados > 8 ? 'bg-red-500 w-full' : 'bg-slate-200 w-0'}`}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Dental (1)</span>
                  <span>0 ocupados</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-200 w-0 h-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal en Turno */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-[#004a87]" /> Personal de Turno
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Médicos (3)</h4>
                <div className="space-y-2">
                  {personalTurno.medicos.map(m => (
                    <div key={m} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div> {m}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Enfermeros (2)</h4>
                <div className="space-y-2">
                  {personalTurno.enfermeros.map(e => (
                    <div key={e} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div> {e}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Altas y Búsqueda */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3 flex flex-col gap-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" /> Altas y Epicrisis
              </CardTitle>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Buscar RUT o Nombre..." 
                  className="text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-emerald-500 w-full"
                  value={searchRut}
                  onChange={e => setSearchRut(e.target.value)}
                />
                <button onClick={handleSearch} className="bg-slate-800 hover:bg-slate-900 text-white px-2 py-1.5 rounded text-xs font-bold flex items-center justify-center">
                  <Search className="w-4 h-4"/>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
              {urgenciasAltas.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No hay altas recientes en este turno.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {urgenciasAltas.map((pac, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-bold text-sm text-slate-800">{pac.nombre}</div>
                        <div className="text-[10px] text-slate-500 font-mono">RUT: {pac.rut}</div>
                      </div>
                      <button onClick={async () => {
                        setLoading(true);
                        try {
                          const ficha = await urgenciaService.getFicha(pac.id);
                          setSelectedFichaEpicrisis({ ...pac, ...ficha });
                          setShowEpicrisisModal(true);
                        } finally {
                          setLoading(false);
                        }
                      }} className="bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Ver
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consultas Rechazadas / Canceladas */}
          <Card className="border-slate-200 shadow-sm mt-6 border-t-4 border-t-red-500">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" /> Consultas Rechazadas / Canceladas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[250px] overflow-y-auto">
              {urgenciasRechazadas.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No hay atenciones canceladas en este turno.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {urgenciasRechazadas.map((pac, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition-colors flex justify-between items-center">
                      <div>
                        <div className="font-bold text-sm text-slate-800">{pac.nombre}</div>
                        <div className="text-[10px] text-slate-500 font-mono">RUT: {pac.rut}</div>
                      </div>
                      <div className="text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100">
                        {pac.motivoCancelacion || 'Rechazo del paciente'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL INGRESO URGENCIAS */}
      {isIngresoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><Activity className="w-5 h-5"/> Registrar Urgencia</h3>
              <button onClick={() => setIsIngresoModalOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">RUT Paciente *</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none" 
                  value={ingresoRut} 
                  onChange={e => setIngresoRut(formatRut(e.target.value))} 
                  placeholder="Ej: 12.345.678-9"
                  maxLength={12}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nombre Completo</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none" 
                  value={ingresoNombre} 
                  onChange={e => setIngresoNombre(e.target.value)} 
                  placeholder="Opcional en urgencia..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Motivo de Consulta *</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none" 
                  rows={3}
                  value={ingresoMotivo} 
                  onChange={e => setIngresoMotivo(e.target.value)} 
                  placeholder="Dolor pecho, accidente, fiebre alta..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setIsIngresoModalOpen(false)} disabled={loading} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-bold text-sm transition">Cancelar</button>
                <button onClick={handleIngresoUrgencia} disabled={loading} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg font-bold text-sm transition flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                  {loading ? 'Registrando...' : 'Confirmar Ingreso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EPICRISIS (Imprimible) */}
      {showEpicrisisModal && selectedFichaEpicrisis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-none print:shadow-none print:h-auto print:max-h-none print:bg-white print:block">
            <div className="p-8 space-y-6">
              <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wider text-slate-800">Historial Médico Completo</h1>
                  <p className="text-slate-500">Servicio de Salud RedNorte</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">Fecha: {new Date().toLocaleDateString()}</p>
                  <p className="text-sm text-slate-500 font-mono">ID: {selectedFichaEpicrisis.idEncuentro}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-bold text-xs uppercase text-slate-500 mb-2">Datos del Paciente</h3>
                  <p><span className="font-medium text-slate-800">Nombre:</span> {selectedFichaEpicrisis.nombre}</p>
                  <p><span className="font-medium text-slate-800">RUT:</span> {selectedFichaEpicrisis.rut}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-bold text-xs uppercase text-slate-500 mb-2">Ingreso y Triage</h3>
                  <p><span className="font-medium text-slate-800">Motivo:</span> {selectedFichaEpicrisis.motivo}</p>
                  <p><span className="font-medium text-slate-800">Categoría ESI:</span> Nivel {selectedFichaEpicrisis.categorizacion}</p>
                </div>
              </div>
              
              {selectedFichaEpicrisis.signosVitales && Object.keys(selectedFichaEpicrisis.signosVitales).length > 0 && (
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2 border-b pb-1">Signos Vitales</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(selectedFichaEpicrisis.signosVitales).map(([k, v]) => (
                      <div key={k} className="text-sm border border-slate-100 p-2 rounded">
                        <span className="text-xs text-slate-500 block uppercase">{k}</span>
                        <span className="font-bold">{v as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFichaEpicrisis.tratamientos && selectedFichaEpicrisis.tratamientos.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2 border-b pb-1">Historial de Tratamientos</h3>
                  <table className="w-full text-sm text-left border border-slate-200">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-2 border-b">Fármaco/Proced.</th>
                        <th className="px-4 py-2 border-b">Detalle</th>
                        <th className="px-4 py-2 border-b">Estado</th>
                        <th className="px-4 py-2 border-b">Fecha/Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFichaEpicrisis.tratamientos.map((t: any, i: number) => (
                        <tr key={i} className="border-b">
                          <td className="px-4 py-2 font-medium">{t.medicamento}</td>
                          <td className="px-4 py-2 text-xs">
                            {t.estadoAdministracion === 'completed' ? `Dosis: ${t.dosis} | Vía: ${t.via} | Tec: ${t.tecnica || '-'}` : (t.motivoRechazo || '-')}
                          </td>
                          <td className="px-4 py-2">
                            {t.estadoAdministracion === 'completed' ? 'Administrado' : t.estadoAdministracion === 'not-done' ? 'Rechazado' : 'No Administrado'}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-500">
                            {t.fechaAdministracion ? new Date(t.fechaAdministracion).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-2 border-b pb-1">Diagnóstico Final e Indicaciones al Alta</h3>
                <div className="p-4 bg-white border border-slate-200 rounded-lg min-h-[100px]">
                  <p className="whitespace-pre-wrap">{selectedFichaEpicrisis.diagnostico || 'Paciente dado de alta de urgencias.'}</p>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500 print:hidden">
                <button onClick={() => setShowEpicrisisModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold">Cerrar</button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Imprimir Historial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR ATENCION */}
      {idToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-600 p-4 text-white flex justify-center items-center">
              <XCircle className="w-12 h-12 mb-2" />
            </div>
            <div className="p-6 text-center space-y-4">
              <h3 className="font-bold text-xl text-slate-800">¿Cancelar Atención?</h3>
              <p className="text-slate-500 text-sm">
                Estás a punto de cancelar esta atención de urgencia. Esta acción es irreversible y el paciente será removido de las listas activas.
              </p>
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIdToDelete(null)} 
                  disabled={loading} 
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                >
                  No, volver
                </button>
                <button 
                  onClick={confirmCancelarAtencion} 
                  disabled={loading} 
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Sí, cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR CITA */}
      {idToCancelCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-600 p-4 text-white flex justify-center items-center">
              <XCircle className="w-12 h-12 mb-2" />
            </div>
            <div className="p-6 text-center space-y-4">
              <h3 className="font-bold text-xl text-slate-800">¿Cancelar Cita Médica?</h3>
              <p className="text-slate-500 text-sm">
                Estás a punto de cancelar esta cita agendada. El registro quedará marcado como cancelado.
              </p>
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIdToCancelCita(null)} 
                  disabled={loading} 
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Volver
                </button>
                <button 
                  onClick={handleCancelarCita} 
                  disabled={loading} 
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Sí, cancelar cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REASIGNAR CITA */}
      {showReasignarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#004a87] p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><Calendar className="w-5 h-5"/> Reasignar Hora</h3>
              <button onClick={() => setShowReasignarModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nueva Fecha</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-[#004a87] focus:ring-1 focus:ring-[#004a87] outline-none" 
                  value={reasignarFecha} 
                  onChange={e => setReasignarFecha(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nueva Hora</label>
                <input 
                  type="time" 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-[#004a87] focus:ring-1 focus:ring-[#004a87] outline-none" 
                  value={reasignarHora} 
                  onChange={e => setReasignarHora(e.target.value)} 
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setShowReasignarModal(false)} disabled={loading} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-bold text-sm transition">Cancelar</button>
                <button onClick={handleReasignarCita} disabled={loading} className="flex-1 px-4 py-2 bg-[#0096c7] hover:bg-[#0077b6] disabled:bg-[#0096c7]/50 text-white rounded-lg font-bold text-sm transition flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                  {loading ? 'Guardando...' : 'Reasignar Cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
