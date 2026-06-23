// src/app/components/pages/2. Dashboards/DashboardView.tsx
import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { DashboardAdmin } from './DashboardAdmin';
import { DashboardAdministrative } from './DashboardAdministrative';
import { DashboardPatient } from './DashboardPatient';
import { DashboardDoctor } from './DashboardDoctor';
import { DashboardNurse } from './DashboardNurse';
import { UserRole } from '../../../../utils/roleMapper';


interface DashboardViewProps {
  initialRole: UserRole;
  onReserva?: () => void;
  // 👇 Agrega patientName y patientRut al final
  onIrAAtencion: (encounterId: string, appointmentId: string, patientId: string, patientName: string, patientRut: string, patientAge: string) => void;
}

export function DashboardView({ initialRole, onReserva, onIrAAtencion }: DashboardViewProps) {  
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole);

  const renderDashboardByRole = () => {
    switch (currentRole) {
      case 'ADMIN': return <DashboardAdmin onReserva={onReserva} />;
      case 'ADMINISTRATIVO': return <DashboardAdministrative />;
      case 'ENFERMERO': return <DashboardNurse />;
      // 👇 Adaptamos la firma para el componente de médico que solo pasa 3 parámetros
      case 'MEDICO':
        return <DashboardDoctor onIrAAtencion={onIrAAtencion} />;
      case 'PACIENTE': return <DashboardPatient />;
      default:
        return (
          <DashboardDoctor
            // 👇 CORREGIR ESTA FIRMA PARA QUE PASE TODOS LOS DATOS
            onIrAAtencion={(encounterId, appointmentId, patientId, patientName, patientRut, patientAge) =>
              onIrAAtencion(encounterId, appointmentId, patientId, patientName, patientRut, patientAge)
            }
          />
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* HEADER INTERNO DEL RESUMEN CLÍNICO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[#004a87] tracking-tight">RedNorte Clínica</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            <span className="font-semibold text-[#00a7b1]">Sede Iquique</span> · Vista de {currentRole}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador Rápido Global */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paciente por RUN..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-full text-xs w-full sm:w-64 focus:ring-2 focus:ring-[#00a7b1]/20 focus:border-[#00a7b1] outline-none transition-all"
            />
          </div>

          {/* Botón Acción Rápida */}
          <button
            onClick={onReserva}
            className="px-4 py-2 rounded-full text-sm font-medium bg-[#0096c7] text-white hover:bg-[#0077b6] transition"
          >
            Reservar hora
          </button>

          {/* SELECTOR DE VISTA (Navbar de desarrollo) 
              Solo dejamos que el ADMIN global cambie de vista a placer para pruebas */}
          {initialRole === 'ADMIN' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 ml-auto lg:ml-2">
              {(['ADMIN', 'ADMINISTRATIVO', 'ENFERMERO', 'MEDICO'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setCurrentRole(r)}
                  className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                    currentRole === r ? 'bg-white text-[#004a87] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {r.slice(0, 5)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTENIDO DEL PANEL CENTRAL */}
      <div>
        {renderDashboardByRole()}
      </div>
    </div>
  );
}