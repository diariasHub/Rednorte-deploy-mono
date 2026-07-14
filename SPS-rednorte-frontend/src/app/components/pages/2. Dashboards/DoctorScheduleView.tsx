import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Clock, Calendar, Hospital, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function DoctorScheduleView() {
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // En un sistema real esto vendría del API, por ahora mockeamos centros
  const centros = [
    { id: 'centro-1', nombre: 'Centro Médico Antofagasta' },
    { id: 'centro-2', nombre: 'Centro Médico Calama' },
    { id: 'centro-3', nombre: 'Sede Iquique' }
  ];

  const handleGenerate = async () => {
    if (!selectedCenter || !selectedDate || !startTime || !endTime) {
      toast.error('Completa todos los campos');
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Usamos el id del médico en lugar de '1'
      const drId = 'medico-1101'; 
      const res = await fetch(`/agendas/${drId}/generar-bloques`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: selectedDate,
          horaInicio: startTime,
          horaFin: endTime,
          centroMedico: selectedCenter,
          nombreMedico: 'Diego Arias'
        })
      });

      if (!res.ok) throw new Error('Error en el servidor');
      const data = await res.json();
      toast.success(`Se generaron ${data.length} bloques de 15 minutos con éxito.`);
      
      // Limpiamos los campos
      setStartTime('');
      setEndTime('');
    } catch (e) {
      console.error(e);
      toast.error('Error al generar disponibilidad horaria');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[#004a87]">Reserva Horaria (Disponibilidad)</h2>
        <p className="text-sm text-slate-500">Configura tus horas de atención clínica para que los pacientes puedan agendar sus citas.</p>
      </div>

      <Card className="shadow-lg border-none overflow-hidden">
        <CardHeader className="bg-white border-b py-5">
          <CardTitle className="text-lg font-bold text-[#004a87] flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#00a7b1]" /> Generar Bloques de Atención
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Centro Médico */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Hospital className="h-4 w-4 text-slate-400" /> Centro Médico
              </label>
              <select 
                value={selectedCenter} 
                onChange={e => setSelectedCenter(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-[#00a7b1]/20 outline-none"
              >
                <option value="">Seleccione un Centro</option>
                {centros.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" /> Fecha de Atención
              </label>
              <input 
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-[#00a7b1]/20 outline-none"
              />
            </div>

            {/* Hora Inicio */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" /> Hora Inicio
              </label>
              <input 
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                min="07:30"
                max="20:00"
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-[#00a7b1]/20 outline-none"
              />
            </div>

            {/* Hora Fin */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" /> Hora Fin
              </label>
              <input 
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                min="07:30"
                max="20:00"
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-[#00a7b1]/20 outline-none"
              />
            </div>

          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-[#0096c7] hover:bg-[#0077b6] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Generar Bloques de 15 min
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
