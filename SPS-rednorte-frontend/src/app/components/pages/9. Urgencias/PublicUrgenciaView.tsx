import { useState, useEffect, useRef } from 'react';
import { Siren, Clock, XCircle, ArrowLeft, AlertTriangle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { urgenciaService } from '../../../../services/urgencia.service';
import { toast } from 'sonner';

export function PublicUrgenciaView({ onBack }: { onBack: () => void }) {
  const [rutEspera, setRutEspera] = useState('');
  const [tiempoEsperaSegundos, setTiempoEsperaSegundos] = useState<number | null>(null);
  const [idEncuentroActivo, setIdEncuentroActivo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nivelEsi, setNivelEsi] = useState<string | null>(null);
  
  // States for rejection confirmation
  const [showConfirmRechazo, setShowConfirmRechazo] = useState(false);
  const [rutConfirmacion, setRutConfirmacion] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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

  const getBaseTimeByEsi = (esi: string) => {
    switch (esi) {
      case '1': return 0;
      case '2': return 15 * 60;
      case '3': return 60 * 60;
      case '4': return 120 * 60;
      case '5': return 240 * 60;
      default: return 60 * 60;
    }
  };

  const checkWaitTime = async (isPolling = false) => {
    try {
      const res = await urgenciaService.consultarEspera(rutEspera);
      
      let simulatedEsi = '3';
      if (res.tiempoEsperaMinutos <= 15) simulatedEsi = '2';
      else if (res.tiempoEsperaMinutos <= 60) simulatedEsi = '3';
      else if (res.tiempoEsperaMinutos <= 120) simulatedEsi = '4';
      else simulatedEsi = '5';
      
      const newSeconds = res.tiempoEsperaMinutos * 60;
      setNivelEsi(simulatedEsi);
      setIdEncuentroActivo(res.idEncuentro);

      setTiempoEsperaSegundos((prev) => {
        if (isPolling && prev !== null && newSeconds > prev + 60) {
          toast.warning('Se ha ingresado una urgencia de mayor gravedad. Su tiempo de espera ha sido actualizado.', {
            duration: 5000,
            icon: <AlertTriangle className="h-5 w-5 text-amber-500" />
          });
        }
        if (prev === null || newSeconds > prev + 60) {
          return newSeconds;
        }
        return prev;
      });

    } catch (error: any) {
      if (!isPolling) {
        toast.error(error.response?.data?.error || 'Error al consultar espera. Verifique su RUT.');
        setTiempoEsperaSegundos(null);
        setIdEncuentroActivo(null);
      } else {
        // Si durante el polling falla (ej. fue cancelado o finalizado), limpiamos todo
        setTiempoEsperaSegundos(null);
        setIdEncuentroActivo(null);
        toast.info('Su atención ya no se encuentra activa en la sala de espera.');
      }
    }
  };

  const handleConsultarEspera = async () => {
    if (!rutEspera) {
      toast.error('Ingrese un RUT válido');
      return;
    }
    setIsLoading(true);
    await checkWaitTime(false);
    setIsLoading(false);
  };

  // Countdown effect
  useEffect(() => {
    if (tiempoEsperaSegundos !== null && tiempoEsperaSegundos > 0) {
      intervaloRef.current = setInterval(() => {
        setTiempoEsperaSegundos((prev) => (prev && prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [tiempoEsperaSegundos]);

  // Polling effect every 20 seconds
  useEffect(() => {
    if (tiempoEsperaSegundos !== null && idEncuentroActivo !== null) {
      pollingRef.current = setInterval(() => {
        checkWaitTime(true);
      }, 20000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [tiempoEsperaSegundos, idEncuentroActivo, rutEspera]);

  const handleConfirmRechazo = async () => {
    if (!rutConfirmacion) {
      toast.error('Debe ingresar su RUT para confirmar.');
      return;
    }
    
    // Validar que el rut coincida con el original
    const rutCleaned = rutEspera;
    const rutConfCleaned = rutConfirmacion;
    
    if (rutCleaned !== rutConfCleaned) {
      toast.error('El RUT ingresado no coincide con el RUT consultado.');
      return;
    }

    if (!idEncuentroActivo) {
      toast.error('No se pudo identificar su atención actual.');
      return;
    }

    setIsRejecting(true);
    try {
      await urgenciaService.rechazar(idEncuentroActivo, rutConfCleaned);
      toast.success('Su consulta ha sido cancelada exitosamente.');
      setTiempoEsperaSegundos(null);
      setIdEncuentroActivo(null);
      setRutEspera('');
      setShowConfirmRechazo(false);
      setRutConfirmacion('');
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      toast.error('Ocurrió un error al intentar cancelar su atención.');
    } finally {
      setIsRejecting(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-[#e63946] text-white p-4 md:p-6 flex items-center justify-between rounded-t-3xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-2 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors font-semibold text-sm">
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </button>
        </div>
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 pr-4">
          <Siren className="h-6 w-6" /> Urgencias 24/7
        </h2>
      </div>
      
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-extrabold text-[#023e8a]">Revisa tu tiempo de espera</h3>
            <p className="text-slate-500 text-sm">Si ya ingresaste por el mesón de Urgencia, ingresa tu RUT para conocer tu estado.</p>
          </div>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">RUT Paciente</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={rutEspera}
                    onChange={(e) => setRutEspera(formatRut(e.target.value))}
                    className="flex-1 border-2 border-slate-200 rounded-xl p-3 focus:ring-4 focus:ring-[#2a9d8f]/20 focus:border-[#2a9d8f] outline-none transition-all font-mono" 
                    placeholder="Ej: 12.345.678-9" 
                    maxLength={12}
                    disabled={tiempoEsperaSegundos !== null} // Bloquear una vez consultado
                  />
                  {!tiempoEsperaSegundos && (
                    <button 
                      onClick={handleConsultarEspera} 
                      disabled={isLoading}
                      className="bg-[#2a9d8f] hover:bg-[#21867a] text-white font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Consultando...' : 'Consultar'}
                    </button>
                  )}
                  {tiempoEsperaSegundos !== null && (
                    <button 
                      onClick={() => {
                        setTiempoEsperaSegundos(null);
                        setIdEncuentroActivo(null);
                        setRutEspera('');
                        setShowConfirmRechazo(false);
                      }} 
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-8 py-3 rounded-xl transition-colors"
                    >
                      Nueva Consulta
                    </button>
                  )}
                </div>
              </div>
              
              {tiempoEsperaSegundos !== null && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-6 bg-gradient-to-br from-[#e6f5f3] to-[#c7ede8] rounded-2xl border border-[#2a9d8f]/30 text-center space-y-2 relative overflow-hidden">
                    {/* Animated background pulse */}
                    <div className="absolute inset-0 bg-[#2a9d8f]/5 animate-pulse rounded-2xl pointer-events-none"></div>
                    
                    <Clock className="h-8 w-8 text-[#2a9d8f] mx-auto mb-2 relative z-10" />
                    <p className="font-bold text-[#1d635a] relative z-10">Tiempo estimado de espera</p>
                    <p className="text-5xl font-black text-[#2a9d8f] relative z-10 font-mono tracking-wider">
                      {formatTime(tiempoEsperaSegundos)}
                    </p>
                    
                    {nivelEsi && (
                      <div className="mt-3 relative z-10">
                        <span className="inline-block bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-[#1d635a] border border-[#2a9d8f]/20 shadow-sm">
                          {nivelEsi === '1' ? 'Riesgo Vital Inmediato' : 
                           nivelEsi === '2' ? 'Emergencia (< 15 min)' : 
                           nivelEsi === '3' ? 'Urgencia (< 60 min)' : 
                           nivelEsi === '4' ? 'Urgencia Menor (< 120 min)' : 
                           'No Urgente (Hasta 240 min)'}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-[#1d635a]/70 mt-4 relative z-10">
                      Su atención será por el Box asignado en pantalla en la sala de espera. Si ingresan emergencias de mayor gravedad, su tiempo podría aumentar.
                    </p>
                  </div>

                  <div className="mt-8 border-t border-slate-100 pt-6">
                    {!showConfirmRechazo ? (
                      <>
                        <p className="text-sm text-slate-500 mb-4 text-center">Si ya no deseas esperar, puedes anular tu atención aquí.</p>
                        <button 
                          onClick={() => setShowConfirmRechazo(true)}
                          className="w-full flex items-center justify-center gap-2 border-2 border-[#e63946] text-[#e63946] hover:bg-[#e63946] hover:text-white font-bold py-3 rounded-xl transition-all"
                        >
                          <XCircle className="h-5 w-5" /> Rechazar Consulta
                        </button>
                      </>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                          <p className="font-bold text-sm flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4" /> ¡Atención!
                          </p>
                          <p className="text-sm">
                            Estás a punto de cancelar tu atención de urgencia. Esta acción no se puede deshacer. Por seguridad, ingresa tu RUT nuevamente para confirmar.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input 
                            type="text" 
                            value={rutConfirmacion}
                            onChange={(e) => setRutConfirmacion(formatRut(e.target.value))}
                            className="flex-1 border-2 border-red-200 rounded-xl p-3 focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-mono" 
                            placeholder="Ingrese su RUT para confirmar" 
                            maxLength={12}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              setShowConfirmRechazo(false);
                              setRutConfirmacion('');
                            }}
                            disabled={isRejecting}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                          >
                            Volver
                          </button>
                          <button 
                            onClick={handleConfirmRechazo}
                            disabled={isRejecting || !rutConfirmacion}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#e63946] hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {isRejecting ? 'Cancelando...' : <><Check className="h-5 w-5" /> Confirmar Rechazo</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

