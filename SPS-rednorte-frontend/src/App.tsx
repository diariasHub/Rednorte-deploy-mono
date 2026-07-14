import { useState, useEffect } from 'react';
import { LoginView } from './app/components/pages/1. Login/Login';
import { Header } from './app/components/layout/Header';
import { Sidebar } from './app/components/layout/Sidebar';
import { DashboardView } from './app/components/pages/2. Dashboards/DashboardView';
import { DashboardNurse } from './app/components/pages/2. Dashboards/DashboardNurse';
import { DashboardDoctor } from './app/components/pages/2. Dashboards/DashboardDoctor';
import { DoctorScheduleView } from './app/components/pages/2. Dashboards/DoctorScheduleView';
import { AppointmentsView } from './app/components/pages/3. AgendaMedica/AppointmentsView';
import { WaitingListView } from './app/components/pages/5. ListaEspera/WaitingListView';
import { NurseTreatmentsView } from './app/components/pages/5. ListaEspera/NurseTreatmentsView';
import { FacilitiesView } from './app/components/pages/6. CentrosAtencion/FacilitiesView';
import { NotificationsView } from './app/components/pages/4. Notificaciones/NotificationsView';
import { AtencionClinicaView } from './app/components/pages/10. AtencionClinica/AtencionClinicaView';
// Importamos el componente de historial que SÍ tienes
import { HistorialClinicoPage } from './app/components/pages/7. VistaHistorial/HistorialClinicoPage'; 

import { HomePage } from './app/home/HomePage';
import { Toaster } from './app/components/ui/sonner';
import { Reservahoraview } from './app/components/pages/8. Reservas/Reservahoraview';
import { UrgenciasView } from './app/components/pages/9. Urgencias/UrgenciasView';
import { PublicUrgenciaView } from './app/components/pages/9. Urgencias/PublicUrgenciaView';
import { ConfirmacionView } from './app/components/pages/8. Reservas/ConfirmacionView';

// SE ELIMINÓ LA IMPORTACIÓN ROTA DE FICHA CLINICA AQUÍ

export default function App() {
  if (window.location.pathname === '/confirmar') {
    return <ConfirmacionView />;
  }

  // 1. Estados de Autenticación
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'));
  
  // 2. Estados de Navegación y UI
  const [showLogin, setShowLogin] = useState(false);
  const [showReserva, setShowReserva] = useState(false);
  const [showUrgenciaPublica, setShowUrgenciaPublica] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const isLoggedIn = !!token && !!userRole;
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [activePatientName, setActivePatientName] = useState<string | null>(null);
  const [activePatientRut, setActivePatientRut] = useState<string | null>(null);
  const [activePatientAge, setActivePatientAge] = useState<string | null>(null);
  // 3. Manejadores de Autenticación
  const handleLoginSuccess = (backendRole: string, receivedToken?: string) => {
    const finalToken = receivedToken || 'simulated-jwt-token';
    
    let normalizedRole = backendRole.toUpperCase();
    if (normalizedRole === 'MEDICO_URGENCIA' || normalizedRole === 'MEDICO') normalizedRole = 'MEDICO';
    else if (normalizedRole === 'ENFERMERA_URGENCIA' || normalizedRole === 'ENFERMERO') normalizedRole = 'ENFERMERO';
    else if (normalizedRole.includes('ADMINISTRATIVO')) normalizedRole = 'ADMINISTRATIVO';
    else if (normalizedRole === 'ADMIN') normalizedRole = 'ADMIN';

    setToken(finalToken);
    setUserRole(normalizedRole);
    localStorage.setItem('token', finalToken);
    localStorage.setItem('userRole', normalizedRole);
    
    setShowLogin(false);
    setActiveView(normalizedRole === 'ENFERMERO' ? 'triage' : 'dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUserRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setActiveView('dashboard');
  };

  // ================= RENDERIZADO PÚBLICO (No Logeado) =================
  if (!isLoggedIn) {
    if (showLogin) {
      return (
        <LoginView 
          onLoginSuccess={handleLoginSuccess} 
          onBack={() => setShowLogin(false)}
        />
      );
    }
    if (showReserva) {
      return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
           <div className="max-w-5xl mx-auto h-[85vh] bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
             <Reservahoraview onBack={() => setShowReserva(false)} />
           </div>
        </div>
      );
    }
    if (showUrgenciaPublica) {
      return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
           <div className="max-w-5xl mx-auto h-[85vh] bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
             <PublicUrgenciaView onBack={() => setShowUrgenciaPublica(false)} />
           </div>
        </div>
      );
    }
    return <HomePage onLogin={() => setShowLogin(true)} onReserva={() => setShowReserva(true)} onUrgencia={() => setShowUrgenciaPublica(true)} />;
  }

  // ================= RENDERIZADO PRIVADO (Logeado) =================
  const renderView = () => {
    const handleIrAAtencion = (encounterId: string, appointmentId: string, patientId: string, patientName: string, patientRut: string, patientAge: string) => {  
      setActiveEncounterId(encounterId);
      setActiveAppointmentId(appointmentId);
      setActivePatientId(patientId);
      setActivePatientName(patientName);
      setActivePatientRut(patientRut);
      setActivePatientAge(patientAge);
      setActiveView('atencion-clinica');
    };

    switch (activeView) {
      case 'dashboard':
      return (
        <DashboardView 
          initialRole={userRole as any} 
          onReserva={() => setActiveView('reserva')} 
          onIrAAtencion={handleIrAAtencion}
        />
      );
      case 'appointments':
        return <AppointmentsView />;
      case 'waiting-list':
        return <WaitingListView />;
      case 'nurse-treatments':
        return (
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <NurseTreatmentsView />
          </div>
        );
      case 'facilities':
        return <FacilitiesView />;
      case 'notifications':
        return <NotificationsView />;
      case 'history':
        return (
          <HistorialClinicoPage 
            userRole={userRole || 'PACIENTE'} 
            loggedPatientId={userRole === 'PACIENTE' ? 'p-196655077' : undefined} 
          />
        );
      case 'reserva':
        return <Reservahoraview onBack={() => setActiveView('dashboard')} />;
      case 'triage':
        return (
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <DashboardNurse />
          </div>
        );
      case 'urgencias':
        return <DashboardDoctor onIrAAtencion={handleIrAAtencion} mode="urgencias" />;
      case 'agenda-medica':
        return <DashboardDoctor onIrAAtencion={handleIrAAtencion} mode="agenda" />;
      case 'reserva-horaria':
        return <DoctorScheduleView />;
      
      case 'atencion-clinica':
      return (
        <AtencionClinicaView 
          encounterId={activeEncounterId} 
          appointmentId={activeAppointmentId} 
          patientId={activePatientId} 
          patientName={activePatientName} 
          patientRut={activePatientRut}   
          patientAge={activePatientAge} // 👇 1. PASAR LA EDAD AQUÍ
          onVolver={() => {
            setActiveEncounterId(null);
            setActiveAppointmentId(null);
            setActivePatientId(null);
            setActivePatientName(null);   
            setActivePatientRut(null);    
            setActivePatientAge(null);  // 👇 2. LIMPIAR LA EDAD AQUÍ
            setActiveView('dashboard');
          }}
        />
      );

      default:
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Vista en desarrollo</h3>
              <p className="text-gray-600">Esta sección estará disponible próximamente</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full flex flex-col pt-16 md:pt-20 bg-background overflow-hidden relative">
      <Toaster position="top-right" richColors closeButton />
      <Header 
        onLogout={handleLogout} 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        userRole={userRole} 
      />

      <div className="flex flex-1 relative overflow-hidden">
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-sm transition-all"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          activeView={activeView}
          userRole={userRole} 
          onViewChange={(view) => {
            setActiveView(view);
            setSidebarOpen(false); 
          }}
          isOpen={sidebarOpen}
        />

        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden md:ml-64 relative">
          <div className="container mx-auto p-4 md:p-6 max-w-7xl">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}