import { Calendar, Pill, FileText } from 'lucide-react';

export function DashboardPatient() {
  return (
    <div className="flex flex-col gap-6">
      {/* Mensaje de Bienvenida */}
      <div className="bg-[#004a87] rounded-2xl p-6 text-white shadow-sm">
        <h2 className="text-xl font-bold">Hola, Paciente Demo</h2>
        <p className="text-sm opacity-80 mt-1">Aquí puedes revisar tu historial clínico, citas y recetas médicas.</p>
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Tarjeta: Próximas Citas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Próxima Cita</h3>
          </div>
          <div className="border-l-2 border-blue-500 pl-3">
            <p className="font-semibold text-sm text-slate-800">Medicina General</p>
            <p className="text-xs text-slate-500">15 de Junio, 2026 - 10:30 AM</p>
            <p className="text-xs text-slate-500">Dr. Médico Demo</p>
          </div>
        </div>

        {/* Tarjeta: Recetas Activas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Pill size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Recetas Activas</h3>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 mb-2">
            <span className="text-slate-600 font-medium">Paracetamol 500mg</span>
            <span className="text-xs text-slate-400">Cada 8 hrs</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">Amoxicilina 250mg</span>
            <span className="text-xs text-slate-400">Cada 12 hrs</span>
          </div>
        </div>

        {/* Tarjeta: Últimos Exámenes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <FileText size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Últimos Exámenes</h3>
          </div>
          <p className="text-sm text-slate-600 mb-1">Hemograma Completo</p>
          <span className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
            Resultados Listos
          </span>
        </div>

      </div>
    </div>
  );
}