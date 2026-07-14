import { useState, useEffect } from 'react';
import { Siren, Activity, Clock, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { urgenciaService } from '../../../../services/urgencia.service';
import { toast } from 'sonner';

export function UrgenciasView() {
  const [activeTab, setActiveTab] = useState<'ingreso' | 'triage' | 'espera' | 'atencion' | 'tratamientos' | 'altas'>('ingreso');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  // State for Ingreso
  const [rutIngreso, setRutIngreso] = useState('');
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [motivo, setMotivo] = useState('');
  const [idEncuentro, setIdEncuentro] = useState('');

  // State for Triage
  const [pacientesPendientes, setPacientesPendientes] = useState<any[]>([]);
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [selectedEncuentroId, setSelectedEncuentroId] = useState('');
  const [nivelTriage, setNivelTriage] = useState('1');
  const [vitalSigns, setVitalSigns] = useState({
    frecuenciaCardiaca: '',
    saturacion: '',
    temperatura: '',
    presion: '',
    frecuenciaRespiratoria: '',
    eva: '',
    glasgow: '',
    glicemia: ''
  });

  // Calcular triage automáticamente cuando cambian los signos vitales
  useEffect(() => {
    // Solo calculamos si hay al menos un valor numérico ingresado
    if (!vitalSigns.frecuenciaCardiaca && !vitalSigns.saturacion && !vitalSigns.temperatura && !vitalSigns.frecuenciaRespiratoria && !vitalSigns.eva && !vitalSigns.glasgow) {
      return;
    }

    let sugerido = 5; 
    
    const fc = parseInt(vitalSigns.frecuenciaCardiaca);
    const spo2 = parseInt(vitalSigns.saturacion);
    const temp = parseFloat(vitalSigns.temperatura);
    const fr = parseInt(vitalSigns.frecuenciaRespiratoria);
    const eva = parseInt(vitalSigns.eva);
    const glasgow = parseInt(vitalSigns.glasgow);

    // Reglas ESI (Emergency Severity Index) - Estándar Internacional
    if (glasgow <= 8 || spo2 < 90 || (fr > 0 && fr < 10) || fr > 35) {
      sugerido = 1; // Riesgo Vital Inmediato (Rojo)
    } 
    else if ((glasgow > 8 && glasgow <= 13) || (spo2 >= 90 && spo2 < 94) || fc > 120 || (fc > 0 && fc < 50) || eva >= 8 || temp > 40) {
      sugerido = 2; // Riesgo Vital Alto (Naranja)
    }
    else if ((fc > 100 && fc <= 120) || (spo2 >= 94 && spo2 < 96) || temp > 38.5 || (eva >= 5 && eva < 8)) {
      sugerido = 3; // Mediana Gravedad (Amarillo)
    }
    else if (eva >= 3 && eva < 5) {
      sugerido = 4; // Riesgo Bajo (Verde)
    }

    setNivelTriage(sugerido.toString());
  }, [vitalSigns]);

  const [isLoadingPendientes, setIsLoadingPendientes] = useState(false);

  const fetchPendientes = async () => {
    setIsLoadingPendientes(true);
    try {
      const res = await urgenciaService.getPendientes();
      setPacientesPendientes(res);
    } catch (error) {
      toast.error('Error al cargar pacientes pendientes');
    } finally {
      setIsLoadingPendientes(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'triage') fetchPendientes();
    else if (activeTab === 'atencion') fetchTriaged();
    else if (activeTab === 'tratamientos') fetchTratamientos();
    else if (activeTab === 'altas') fetchAltas();
  }, [activeTab]);

  // State for Espera
  const [rutEspera, setRutEspera] = useState('');
  const [tiempoEspera, setTiempoEspera] = useState<number | null>(null);

  // State for Atención
  const [pacientesTriaged, setPacientesTriaged] = useState<any[]>([]);
  const [showAtencionModal, setShowAtencionModal] = useState(false);
  const [fichaClinica, setFichaClinica] = useState<any>(null);
  const [atencionId, setAtencionId] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [isLoadingTriaged, setIsLoadingTriaged] = useState(false);
  
  // Nuevo state para prescripción en box
  const [medicamento, setMedicamento] = useState('');
  const [indicacionesMedicamento, setIndicacionesMedicamento] = useState('');

  // State for Tratamientos (Enfermero)
  const [tratamientosPendientes, setTratamientosPendientes] = useState<any[]>([]);
  const [showTratamientoModal, setShowTratamientoModal] = useState(false);
  const [selectedTratamiento, setSelectedTratamiento] = useState<any>(null);
  const [adminDetalles, setAdminDetalles] = useState({ dosis: '', via: '', tecnica: '', motivo: '' });
  const [isLoadingTratamientos, setIsLoadingTratamientos] = useState(false);

  // State for Altas
  const [pacientesAltas, setPacientesAltas] = useState<any[]>([]);
  const [showEpicrisisModal, setShowEpicrisisModal] = useState(false);
  const [selectedFichaEpicrisis, setSelectedFichaEpicrisis] = useState<any>(null);

  const fetchTriaged = async () => {
    setIsLoadingTriaged(true);
    try {
      const res = await urgenciaService.getTriaged();
      setPacientesTriaged(res);
    } catch (error) {
      toast.error('Error al cargar pacientes para atención');
    } finally {
      setIsLoadingTriaged(false);
    }
  };

  const fetchTratamientos = async () => {
    setIsLoadingTratamientos(true);
    try {
      const res = await urgenciaService.getTratamientosPendientes();
      setTratamientosPendientes(res);
    } catch (error) {
      toast.error('Error al cargar tratamientos pendientes');
    } finally {
      setIsLoadingTratamientos(false);
    }
  };

  const fetchAltas = async () => {
    try {
      const res = await urgenciaService.getAltas();
      setPacientesAltas(res);
    } catch (error) {
      toast.error('Error al cargar pacientes de alta');
    }
  };

  const openAtencion = async (id: string) => {
    setAtencionId(id);
    setShowAtencionModal(true);
    setFichaClinica(null);
    try {
      const ficha = await urgenciaService.getFicha(id);
      setFichaClinica(ficha);
    } catch (error) {
      toast.error('Error al cargar ficha clínica');
    }
  };

  // RUT Formatter
  const formatRut = (value: string) => {
    let rut = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (rut.length > 1) {
      const body = rut.slice(0, -1);
      const dv = rut.slice(-1);
      rut = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
    }
    return rut;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRutIngreso(formatRut(e.target.value));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIngreso = async () => {
    if (!rutIngreso || !nombrePaciente || !motivo) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Validar si ya está en espera
    try {
      await urgenciaService.consultarEspera(rutIngreso);
      // Si la consulta no arroja error, significa que el paciente ya está en espera
      toast.error('El paciente ya se encuentra en la lista de espera actual.');
      setIsSubmitting(false);
      return;
    } catch (err) {
      // Si arroja error (ej. 404), significa que NO está en espera, entonces podemos continuar
    }

    try {
      const res = await urgenciaService.ingreso(rutIngreso, motivo, nombrePaciente);
      toast.success('Ingreso registrado con éxito', { description: res });
      
      if (typeof res === 'string') {
        const match = res.match(/ID Encuentro:\s*(\S+)/);
        if (match && match[1]) {
          setIdEncuentro(match[1]);
          setAtencionId(match[1]);
        }
      }
      setRutIngreso('');
      setNombrePaciente('');
      setMotivo('');
      // Opcional: pasar a la vista de triage para que el enfermero lo vea
      // setActiveTab('triage');
    } catch (error: any) {
      const msg = error.response?.data || 'Error al registrar ingreso';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriage = async () => {
    try {
      const payload = {
        categorizacion: nivelTriage,
        ...vitalSigns
      };
      const res = await urgenciaService.triage(selectedEncuentroId, payload);
      toast.success('Triage completado', { description: res });
      setShowTriageModal(false);
      setVitalSigns({ frecuenciaCardiaca: '', saturacion: '', temperatura: '', presion: '', frecuenciaRespiratoria: '', eva: '', glasgow: '', glicemia: '' });
      fetchPendientes();
    } catch (error) {
      toast.error('Error al procesar triage');
    }
  };

  const handleConsultarEspera = async () => {
    try {
      const res = await urgenciaService.consultarEspera(rutEspera);
      setTiempoEspera(res.tiempoEsperaMinutos);
      toast.success('Consulta exitosa');
    } catch (error) {
      toast.error('Error al consultar espera');
    }
  };

  const handleAlta = async () => {
    setIsGlobalLoading(true);
    try {
      const res = await urgenciaService.alta(atencionId, diagnostico);
      toast.success('Alta registrada', { description: res });
      setDiagnostico('');
      setShowAtencionModal(false);
      fetchTriaged();
    } catch (error: any) {
      toast.error(error.response?.data || 'Error al dar de alta (revise si hay tratamientos pendientes)');
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleIndicarTratamiento = async () => {
    if (!medicamento || !indicacionesMedicamento) {
      toast.error('Complete medicamento e indicaciones');
      return;
    }
    setIsGlobalLoading(true);
    try {
      const res = await urgenciaService.indicarTratamiento(atencionId, medicamento, indicacionesMedicamento);
      toast.success('Tratamiento recetado', { description: res });
      setMedicamento('');
      setIndicacionesMedicamento('');
      // Recargar ficha
      const ficha = await urgenciaService.getFicha(atencionId);
      setFichaClinica(ficha);
    } catch (error) {
      toast.error('Error al indicar tratamiento');
    } finally {
      setIsGlobalLoading(false);
    }
  };

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
    
    setIsGlobalLoading(true);
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
      setIsGlobalLoading(false);
    }
  };

  return (
    <div className="mt-[104px] md:mt-[88px] min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-8 font-sans">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#e63946] tracking-tight flex items-center gap-3">
            <Siren className="h-8 w-8" /> Flujo de Urgencias
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Módulo de atención rápida y categorización
          </p>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('ingreso')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'ingreso' ? 'bg-[#e63946] text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          <FileText className="h-4 w-4" /> Recepción
        </button>
        <button
          onClick={() => setActiveTab('triage')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'triage' ? 'bg-[#f4a261] text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          <Activity className="h-4 w-4" /> Triage
        </button>
        <button
          onClick={() => setActiveTab('espera')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'espera' ? 'bg-[#2a9d8f] text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          <Clock className="h-4 w-4" /> Sala de Espera
        </button>
        <button
          onClick={() => setActiveTab('atencion')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'atencion' ? 'bg-[#004a87] text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          <CheckCircle className="h-4 w-4" /> Atención y Alta
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'ingreso' && (
          <Card className="max-w-2xl border-none shadow-md">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
              <CardTitle className="text-lg font-bold text-slate-800">Registro de Ingreso</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RUT Paciente</label>
                <input 
                  type="text" 
                  value={rutIngreso}
                  onChange={handleRutChange}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946] outline-none" 
                  placeholder="Ej: 12345678-9" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946] outline-none" 
                  placeholder="Ej: Juan Pérez" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de Consulta</label>
                <textarea 
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946] outline-none" 
                  rows={3} 
                  placeholder="Ej: Dolor en el pecho" 
                />
              </div>
              <button 
                onClick={handleIngreso} 
                disabled={isSubmitting}
                className={`w-full text-white font-bold py-3 rounded-lg transition-colors ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#e63946] hover:bg-[#c1121f]'}`}
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Ingreso'}
              </button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'triage' && (
          <div className="space-y-4">
            <Card className="border-none shadow-md">
              <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800">Pacientes Pendientes de Triage</CardTitle>
                <button 
                  onClick={fetchPendientes} 
                  disabled={isLoadingPendientes}
                  className={`text-sm font-semibold transition-colors ${isLoadingPendientes ? 'text-slate-400' : 'text-[#f4a261] hover:underline'}`}
                >
                  {isLoadingPendientes ? 'Actualizando...' : 'Actualizar Lista'}
                </button>
              </CardHeader>
              <CardContent className="p-0">
                {pacientesPendientes.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No hay pacientes pendientes de triage en este momento.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pacientesPendientes.map((pac, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-bold text-slate-800">{pac.nombre}</div>
                          <div className="text-sm text-slate-500">RUT: {pac.rut} • Motivo: {pac.motivo}</div>
                          <div className="text-xs text-slate-400 mt-1">ID Encuentro: {pac.id}</div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedEncuentroId(pac.id);
                            setShowTriageModal(true);
                          }}
                          className="bg-[#f4a261] hover:bg-[#e76f51] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          Realizar Triage
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {showTriageModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[#f4a261]" /> Categorización y Signos Vitales
                    </h3>
                    <button onClick={() => setShowTriageModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                      ✕
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nivel de Gravedad (ESI)</label>
                      <select 
                        value={nivelTriage}
                        onChange={(e) => setNivelTriage(e.target.value)}
                        className={`w-full border rounded-lg p-3 outline-none font-bold transition-colors ${
                          nivelTriage === '1' ? 'bg-red-100 border-red-300 text-red-800' :
                          nivelTriage === '2' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                          nivelTriage === '3' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                          nivelTriage === '4' ? 'bg-green-100 border-green-300 text-green-800' :
                          'bg-blue-100 border-blue-300 text-blue-800'
                        }`}
                      >
                        <option value="1">ESI 1 - Riesgo Vital Inmediato (Rojo)</option>
                        <option value="2">ESI 2 - Riesgo Vital Alto (Naranja)</option>
                        <option value="3">ESI 3 - Mediana Gravedad (Amarillo)</option>
                        <option value="4">ESI 4 - Riesgo Vital Bajo (Verde)</option>
                        <option value="5">ESI 5 - Atención General (Azul)</option>
                      </select>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">Signos Vitales (Opcionales)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Frecuencia Cardíaca (lpm)</label>
                          <input type="number" value={vitalSigns.frecuenciaCardiaca} onChange={e => setVitalSigns({...vitalSigns, frecuenciaCardiaca: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#f4a261]/20 outline-none" placeholder="Ej: 80" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Saturación O2 (%)</label>
                          <input type="number" value={vitalSigns.saturacion} onChange={e => setVitalSigns({...vitalSigns, saturacion: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#f4a261]/20 outline-none" placeholder="Ej: 98" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Temperatura (°C)</label>
                          <input type="number" step="0.1" value={vitalSigns.temperatura} onChange={e => setVitalSigns({...vitalSigns, temperatura: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#f4a261]/20 outline-none" placeholder="Ej: 36.5" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Presión Arterial (mmHg)</label>
                          <input type="text" value={vitalSigns.presion} onChange={e => setVitalSigns({...vitalSigns, presion: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#f4a261]/20 outline-none" placeholder="Ej: 120/80" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Frecuencia Respiratoria (rpm)</label>
                          <input type="number" value={vitalSigns.frecuenciaRespiratoria} onChange={e => setVitalSigns({...vitalSigns, frecuenciaRespiratoria: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#f4a261]/20 outline-none" placeholder="Ej: 16" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Dolor (Escala EVA 1-10)</label>
                          <input type="number" min="1" max="10" value={vitalSigns.eva} onChange={e => setVitalSigns({...vitalSigns, eva: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#f4a261]/20 outline-none" placeholder="Ej: 5" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Escala de Glasgow (3-15)</label>
                          <input type="number" min="3" max="15" value={vitalSigns.glasgow} onChange={e => setVitalSigns({...vitalSigns, glasgow: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#f4a261]/20 outline-none" placeholder="Ej: 15" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">HGT / Glicemia (mg/dL)</label>
                          <input type="number" value={vitalSigns.glicemia} onChange={e => setVitalSigns({...vitalSigns, glicemia: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#f4a261]/20 outline-none" placeholder="Ej: 90" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3 sticky bottom-0">
                    <button onClick={() => setShowTriageModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleTriage} className="bg-[#f4a261] hover:bg-[#e76f51] text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md">
                      Guardar Triage
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'espera' && (
          <Card className="max-w-2xl border-none shadow-md">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
              <CardTitle className="text-lg font-bold text-slate-800">Consulta de Espera</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RUT Paciente</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={rutEspera}
                    onChange={(e) => setRutEspera(formatRut(e.target.value))}
                    className="flex-1 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#2a9d8f]/20 focus:border-[#2a9d8f] outline-none" 
                    placeholder="Ej: 12345678-9" 
                  />
                  <button onClick={handleConsultarEspera} className="bg-[#2a9d8f] hover:bg-[#21867a] text-white font-bold px-6 rounded-lg transition-colors">
                    Consultar
                  </button>
                </div>
              </div>
              
              {tiempoEspera !== null && (
                <div className="mt-4 p-4 bg-[#e6f5f3] rounded-lg border border-[#2a9d8f]/30 flex items-center justify-between">
                  <span className="font-medium text-[#1d635a]">Tiempo estimado de espera:</span>
                  <span className="text-2xl font-black text-[#2a9d8f]">{tiempoEspera} min</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'atencion' && (
          <div className="space-y-4">
            <Card className="border-none shadow-md">
              <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800">Pacientes en Box (Triagados)</CardTitle>
                <button 
                  onClick={fetchTriaged} 
                  disabled={isLoadingTriaged}
                  className={`text-sm font-semibold transition-colors ${isLoadingTriaged ? 'text-slate-400' : 'text-[#004a87] hover:underline'}`}
                >
                  {isLoadingTriaged ? 'Actualizando...' : 'Actualizar Lista'}
                </button>
              </CardHeader>
              <CardContent className="p-0">
                {pacientesTriaged.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No hay pacientes esperando atención médica.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pacientesTriaged.map((pac, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-bold text-slate-800">{pac.nombre}</div>
                          <div className="text-sm text-slate-500">RUT: {pac.rut} • Motivo: {pac.motivo}</div>
                          <div className="text-xs font-bold mt-1 text-[#e63946]">ESI Nivel {pac.categorizacion}</div>
                        </div>
                        <button
                          onClick={() => openAtencion(pac.id)}
                          className="bg-[#004a87] hover:bg-[#003561] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          Atender Paciente
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {showAtencionModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-[#004a87]" /> Atención Médica
                    </h3>
                    <button onClick={() => setShowAtencionModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                      ✕
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {fichaClinica ? (
                      <>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h4 className="font-bold text-slate-800 mb-2">Información del Triage</h4>
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div><span className="text-slate-500">Motivo:</span> <span className="font-medium">{fichaClinica.motivo}</span></div>
                            <div><span className="text-slate-500">Categoría ESI:</span> <span className="font-medium text-[#e63946]">Nivel {fichaClinica.categorizacion}</span></div>
                          </div>
                          
                          {fichaClinica.signosVitales && Object.keys(fichaClinica.signosVitales).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <h5 className="font-bold text-slate-700 text-xs mb-2 uppercase tracking-wider">Signos Vitales</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(fichaClinica.signosVitales).map(([key, val]) => (
                                  <div key={key} className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{key}</div>
                                    <div className="font-black text-slate-700">{val as string}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Diagnóstico y Tratamiento Final</label>
                          <textarea 
                            value={diagnostico}
                            onChange={(e) => setDiagnostico(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-[#004a87]/20 focus:border-[#004a87] outline-none min-h-[120px]" 
                            placeholder="Ej: Paciente estable tras administración de medicamentos. Se indica reposo por 3 días." 
                          />
                        </div>
                      </>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <Activity className="h-8 w-8 animate-pulse mb-4 text-[#004a87]" />
                        <p>Cargando ficha clínica...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3 sticky bottom-0">
                    <button onClick={() => setShowAtencionModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleAlta} disabled={!fichaClinica || !diagnostico.trim()} className="bg-[#004a87] hover:bg-[#003561] disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md">
                      Registrar Alta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
