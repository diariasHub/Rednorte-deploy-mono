import { 
  Users, Calendar, XSquare, RefreshCw, AlertCircle, Plus, Clock, Activity, CheckCircle, Search, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useState, useEffect } from 'react';
import { patientRemote } from '../../../../remotes/patient.remote';
import { appointmentsRemote } from '../../../../remotes/appointments.remote';
import { urgenciaService } from '../../../../services/urgencia.service';
import { toast } from 'sonner';

interface DashboardAdminProps {
  onReserva?: () => void;
}

export function DashboardAdmin({ onReserva }: DashboardAdminProps) {
  const [activeTab, setActiveTab] = useState<'urgencia' | 'agenda'>('urgencia');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    cancellations: 0,
    reassignments: 4,
  });

  const [urgenciasPendientes, setUrgenciasPendientes] = useState<any[]>([]);
  const [urgenciasTriaged, setUrgenciasTriaged] = useState<any[]>([]);
  const [urgenciasAltas, setUrgenciasAltas] = useState<any[]>([]);
  const [citasDelDia, setCitasDelDia] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false);
  const [ingresoRut, setIngresoRut] = useState('');
  const [ingresoNombre, setIngresoNombre] = useState('');
  const [ingresoMotivo, setIngresoMotivo] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        totalPats, 
        totalAppts, 
        pendientes, 
        triaged, 
        altas,
        todasLasCitas
      ] = await Promise.all([
        patientRemote.getTotalCount(),
        appointmentsRemote.getTotalCount(),
        urgenciaService.getPendientes(),
        urgenciaService.getTriaged(),
        urgenciaService.getAltas(),
        appointmentsRemote.getAll()
      ]);

      setStats({
        totalPatients: totalPats,
        totalAppointments: totalAppts,
        cancellations: 0,
        reassignments: 4,
      });

      setUrgenciasPendientes(pendientes || []);
      setUrgenciasTriaged(triaged || []);
      setUrgenciasAltas(altas || []);

      // Guardar todas las citas
      const arrCitas = todasLasCitas?.entry ? todasLasCitas.entry.map((e: any) => e.resource) : (Array.isArray(todasLasCitas) ? todasLasCitas : []);
      setAllAppointments(arrCitas);

    } catch (error) {
      console.error("Error cargando datos del administrador", error);
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const citasFiltradas = allAppointments.filter((cita: any) => {
      if (!cita.start) return false;
      return cita.start.startsWith(selectedDate);
    });
    setCitasDelDia(citasFiltradas);
  }, [selectedDate, allAppointments]);

  const handleIngresoUrgencia = async () => {
    if (!ingresoRut || !ingresoMotivo) {
      toast.error('RUT y Motivo son obligatorios');
      return;
    }
    try {
      await urgenciaService.ingreso(ingresoRut, ingresoMotivo, ingresoNombre);
      toast.success('Ingreso registrado exitosamente');
      setIsIngresoModalOpen(false);
      setIngresoRut('');
      setIngresoNombre('');
      setIngresoMotivo('');
      fetchData();
    } catch (e) {
      toast.error('Error al registrar ingreso');
    }
  };

  // Helper para mostrar paciente en FHIR bundle de Appointment
  const getPatientName = (appointment: any) => {
    const participants = appointment.participant;
    if (!participants) return 'Desconocido';
    const p = participants.find((part: any) => part.actor?.reference?.startsWith('Patient/'));
    if (!p) return 'Desconocido';
    
    if (p.actor.display) return p.actor.display;

    const patientId = p.actor.reference.replace('Patient/', '');
    const patientResource = allAppointments.find((res: any) => res.resourceType === 'Patient' && res.id === patientId);
    
    if (patientResource && patientResource.name && patientResource.name[0]) {
      const name = patientResource.name[0];
      const given = name.given ? name.given.join(' ') : '';
      const family = name.family || '';
      return `${given} ${family}`.trim() || 'Paciente Registrado';
    }

    return 'Paciente Registrado';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-[#004a87]">Panel de Control Central</h2>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button 
            onClick={() => setIsIngresoModalOpen(true)}
            className="flex items-center gap-2 bg-[#e63946] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#c9323d] transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> Ingreso Urgencia
          </button>
          <button 
            onClick={onReserva}
            className="flex items-center gap-2 bg-[#00a7b1] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#008f98] transition shadow-sm"
          >
            <Calendar className="h-4 w-4" /> Agendar Cita
          </button>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Total Pacientes (FHIR)</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.totalPatients}</h3>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Total Citas Médicas</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.totalAppointments}</h3>
              </div>
              <Calendar className="h-8 w-8 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Pacientes en Urgencias</p>
                <h3 className="text-2xl font-bold text-slate-800">{urgenciasPendientes.length + urgenciasTriaged.length}</h3>
              </div>
              <Activity className="h-8 w-8 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Altas de Urgencia</p>
                <h3 className="text-2xl font-bold text-slate-800">{urgenciasAltas.length}</h3>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS */}
      <div className="border-b border-slate-200 flex gap-6">
        <button 
          onClick={() => setActiveTab('urgencia')}
          className={`pb-3 font-bold transition-all ${activeTab === 'urgencia' ? 'text-[#004a87] border-b-2 border-[#004a87]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Flujo de Urgencias
        </button>
        <button 
          onClick={() => setActiveTab('agenda')}
          className={`pb-3 font-bold transition-all ${activeTab === 'agenda' ? 'text-[#00a7b1] border-b-2 border-[#00a7b1]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Agenda Médica (Hoy)
        </button>
      </div>

      {/* CONTENIDO TABS */}
      {activeTab === 'urgencia' && (
        <div className="grid gap-6 md:grid-cols-3">
          
          <Card className="shadow-md border-t-4 border-t-amber-400">
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" /> Sin Triage ({urgenciasPendientes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              <ul className="divide-y divide-slate-100">
                {urgenciasPendientes.length === 0 && <li className="p-4 text-center text-xs text-slate-400">No hay pacientes pendientes</li>}
                {urgenciasPendientes.map((p) => (
                  <li key={p.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-bold text-slate-800">{p.nombre}</p>
                    <p className="text-xs text-slate-500">{p.rut} • {p.motivo}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-md border-t-4 border-t-red-500">
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" /> Triaged y En Box ({urgenciasTriaged.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              <ul className="divide-y divide-slate-100">
                {urgenciasTriaged.length === 0 && <li className="p-4 text-center text-xs text-slate-400">No hay pacientes en box</li>}
                {urgenciasTriaged.map((p) => (
                  <li key={p.id} className="p-3 hover:bg-slate-50 transition-colors flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.nombre}</p>
                      <p className="text-[10px] text-slate-500">{p.rut}</p>
                      <p className="text-xs text-[#004a87] font-medium">{p.location || 'Esperando Box'}</p>
                    </div>
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded">
                      ESI {p.categorizacion}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-md border-t-4 border-t-emerald-500">
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> Altas Médicas ({urgenciasAltas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              <ul className="divide-y divide-slate-100">
                {urgenciasAltas.length === 0 && <li className="p-4 text-center text-xs text-slate-400">No hay altas procesadas</li>}
                {urgenciasAltas.map((p) => (
                  <li key={p.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-bold text-slate-800">{p.nombre}</p>
                    <p className="text-[10px] text-slate-500 mb-1">{p.rut}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.tipoAlta === 'Hospitalización' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      Alta: {p.tipoAlta}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

        </div>
      )}

      {activeTab === 'agenda' && (
        <Card className="shadow-md border-none">
          <CardHeader className="bg-white border-b py-4 flex flex-row justify-between items-center">
            <CardTitle className="text-base font-bold text-[#00a7b1] flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Agenda Médica Activa
            </CardTitle>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#00a7b1] focus:ring-1 focus:ring-[#00a7b1] transition-all cursor-pointer hover:bg-slate-100"
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Paciente</th>
                    <th className="px-6 py-4">Hora</th>
                    <th className="px-6 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {citasDelDia.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-sm text-slate-400">
                        No hay citas agendadas para esta fecha.
                      </td>
                    </tr>
                  )}
                  {citasDelDia.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{getPatientName(c)}</p>
                            <p className="text-[11px] text-slate-500">ID FHIR: {c.id}</p>
                            {c.description && <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] truncate" title={c.description}>{c.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {new Date(c.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                          {c.status || 'booked'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL INGRESO URGENCIA */}
      {isIngresoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl border-none animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#e63946]" /> Ingreso a Urgencias
              </CardTitle>
              <button onClick={() => setIsIngresoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RUT Paciente *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={ingresoRut}
                    onChange={(e) => setIngresoRut(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946] outline-none" 
                    placeholder="Ej: 12.345.678-9" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={ingresoNombre}
                  onChange={(e) => setIngresoNombre(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946] outline-none" 
                  placeholder="Ej: Juan Pérez" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de Consulta *</label>
                <textarea 
                  value={ingresoMotivo}
                  onChange={(e) => setIngresoMotivo(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946] outline-none" 
                  rows={3} 
                  placeholder="Describa el motivo por el cual el paciente asiste a urgencias..." 
                />
              </div>
              <button onClick={handleIngresoUrgencia} className="w-full bg-[#e63946] hover:bg-[#c9323d] text-white font-bold py-3 rounded-lg transition-colors mt-2">
                Registrar Ingreso
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
