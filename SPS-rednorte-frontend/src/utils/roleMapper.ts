// src/utils/roleMapper.ts
export type UserRole = 'ADMIN' | 'ADMINISTRATIVO' | 'ENFERMERO' | 'MEDICO' | 'PACIENTE';

export function mapBackendRole(backendRole: string): UserRole {
  switch (backendRole) {
    case 'ADMIN':
      return 'ADMIN';
    case 'MEDICO_URGENCIA':
      return 'MEDICO';
    case 'ENFERMERA_URGENCIA':
      return 'ENFERMERO';
    case 'ADMINISTRATIVO_GESTION':
      return 'ADMINISTRATIVO';
    case 'PACIENTE':              // <-- ¡Agregamos esta línea!
      return 'PACIENTE';          // <-- ¡Y esta!
    default:
      return 'MEDICO'; // Rol por defecto seguro o de contingencia
  }
}