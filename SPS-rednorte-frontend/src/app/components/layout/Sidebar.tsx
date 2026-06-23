import {
  Calendar,
  Clock,
  Hospital,
  LayoutDashboard,
  FileText,
  Bell,
  Activity,
  Settings,
} from 'lucide-react';
import { cn } from '../ui/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen?: boolean;
  userRole?: string | null;
}

// 1. Agregamos "allowedRoles" a cada opción
const navigationGroups = [
  {
    title: 'Panel Clínico',
    items: [
      { id: 'dashboard', label: 'Resumen Clínico', icon: LayoutDashboard, allowedRoles: ['ADMIN', 'ADMINISTRATIVO', 'ENFERMERO', 'MEDICO', 'PACIENTE'] },
    ],
  },
  {
    title: 'Atención del Paciente',
    items: [
      { id: 'appointments', label: 'Citas Médicas', icon: Calendar, allowedRoles: ['ADMIN', 'ADMINISTRATIVO', 'ENFERMERO', 'MEDICO', 'PACIENTE'] },
      { id: 'history', label: 'Historial Clínico', icon: FileText, allowedRoles: ['ADMIN', 'MEDICO', 'ENFERMERO', 'PACIENTE'] },
    ],
  },
  {
    title: 'Gestión Crítica',
    items: [
      { id: 'urgencias', label: 'Urgencias', icon: Activity, allowedRoles: ['ADMIN', 'ENFERMERO', 'MEDICO'] },
      { id: 'waiting-list', label: 'Lista de Espera', icon: Clock, allowedRoles: ['ADMIN', 'ADMINISTRATIVO', 'ENFERMERO', 'MEDICO'] },
      { id: 'notifications', label: 'Alertas Clínicas', icon: Bell, allowedRoles: ['ADMIN', 'ADMINISTRATIVO', 'ENFERMERO', 'MEDICO'] },
    ],
  },
  {
    title: 'Administración',
    items: [
      { id: 'facilities', label: 'Establecimientos', icon: Hospital, allowedRoles: ['ADMIN', 'ADMINISTRATIVO', 'ENFERMERO', 'MEDICO', 'PACIENTE'] },
      { id: 'reports', label: 'Indicadores', icon: Activity, allowedRoles: ['ADMIN', 'ADMINISTRATIVO'] },
      { id: 'settings', label: 'Configuración', icon: Settings, allowedRoles: ['ADMIN', 'ADMINISTRATIVO'] },
    ],
  },
];

export function Sidebar({ activeView, onViewChange, isOpen = false, userRole }: SidebarProps) {
  
  // 2. Lógica de Filtrado: 
  // - Dejamos un rol por defecto en caso de que venga null (PACIENTE es el más restrictivo/seguro)
  const currentRole = userRole || 'PACIENTE';
  
  // - Filtramos los items de cada grupo y luego eliminamos los grupos que se quedaron sin items
  const filteredGroups = navigationGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.allowedRoles.includes(currentRole))
    }))
    .filter(group => group.items.length > 0);

  return (
    <aside
      className={cn(
        // 👇 más aire abajo (bottom-2 + padding visual), top alineado a mobile/desktop
        'fixed left-0.5 top-16 md:top-20 bottom-2 z-40 w-64 border-r border-border bg-white flex flex-col rounded-r-xl transition-transform duration-200',
        !isOpen && '-translate-x-full md:translate-x-0'
      )}
    >
      {/* NAV */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* 3. Mapeamos sobre los grupos ya filtrados */}
        {filteredGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-[#e6f4f9] text-[#023e8a]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#023e8a]'
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#0096c7]" />
                    )}

                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive ? 'text-[#0096c7]' : 'text-slate-400'
                      )}
                    />

                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* FOOTER CARD (sin "Paciente") */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-[#f1f9fc] px-3 py-2.5">

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0096c7] to-[#023e8a] text-white text-xs font-bold">
            {/* Si quisieras las iniciales reales, se calcularían aquí */}
            JP
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#023e8a] truncate">
              {/* Aquí luego reemplazaremos con el nombre real de tu API */}
              Juan Pérez
            </p>

            <p className="text-[11px] text-slate-500 truncate">
              Activo
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}