import { useState } from 'react';
import { Siren, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { urgenciaService } from '../../../../services/urgencia.service';
import { toast } from 'sonner';

export function PublicUrgenciaView({ onBack }: { onBack: () => void }) {
  const [rutEspera, setRutEspera] = useState('');
  const [tiempoEspera, setTiempoEspera] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConsultarEspera = async () => {
    if (!rutEspera) {
      toast.error('Ingrese un RUT válido');
      return;
    }
    setIsLoading(true);
    try {
      const res = await urgenciaService.consultarEspera(rutEspera);
      setTiempoEspera(res.tiempoEsperaMinutos);
      toast.success('Consulta exitosa');
    } catch (error) {
      toast.error('Error al consultar espera. Verifique su RUT.');
      setTiempoEspera(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRechazarConsulta = () => {
    // Aquí se implementaría el soft delete o actualización de estado a "Cancelado"
    toast.success('Su consulta ha sido cancelada exitosamente.');
    setTiempoEspera(null);
    setRutEspera('');
    setTimeout(() => {
      onBack();
    }, 1500);
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
                    onChange={(e) => setRutEspera(e.target.value)}
                    className="flex-1 border-2 border-slate-200 rounded-xl p-3 focus:ring-4 focus:ring-[#2a9d8f]/20 focus:border-[#2a9d8f] outline-none transition-all" 
                    placeholder="Ej: 12345678-9" 
                  />
                  <button 
                    onClick={handleConsultarEspera} 
                    disabled={isLoading}
                    className="bg-[#2a9d8f] hover:bg-[#21867a] text-white font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Consultando...' : 'Consultar'}
                  </button>
                </div>
              </div>
              
              {tiempoEspera !== null && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-6 bg-[#e6f5f3] rounded-2xl border border-[#2a9d8f]/30 text-center space-y-2">
                    <Clock className="h-8 w-8 text-[#2a9d8f] mx-auto mb-2" />
                    <p className="font-bold text-[#1d635a]">Tiempo estimado de espera</p>
                    <p className="text-5xl font-black text-[#2a9d8f]">{tiempoEspera} <span className="text-xl">min</span></p>
                    <p className="text-xs text-[#1d635a]/70 mt-2">Su atención será por el Box asignado en pantalla en la sala de espera.</p>
                  </div>

                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <p className="text-sm text-slate-500 mb-4 text-center">Si ya no deseas esperar, puedes anular tu atención aquí.</p>
                    <button 
                      onClick={handleRechazarConsulta}
                      className="w-full flex items-center justify-center gap-2 border-2 border-[#e63946] text-[#e63946] hover:bg-[#e63946] hover:text-white font-bold py-3 rounded-xl transition-all"
                    >
                      <XCircle className="h-5 w-5" /> Rechazar Consulta
                    </button>
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
