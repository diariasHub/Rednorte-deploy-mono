import axios from 'axios';
import type { Doctor } from '../app/types/Booking';

// APUNTAMOS DIRECTO A LA PUERTA TRASERA (HAPI FHIR)
const FHIR_BASE_URL = '/fhir'; 

export interface SpecialtyDTO {
  id: string;
  name: string;
  icon: string;
}

export const medicalRemote = {
  getSpecialties: async (): Promise<SpecialtyDTO[]> => {
    try {
      // Pedimos los centros/especialidades que creamos como "Location"
      const response = await axios.get(`${FHIR_BASE_URL}/Location`); 
      const bundle = response.data;
      
      if (!bundle.entry || bundle.entry.length === 0) {
        return getMockSpecialties();
      }

      // Mapeamos el formato estándar médico a lo que entiende tu React
      return bundle.entry.map((item: any) => {
        const resource = item.resource;
        return {
          id: resource.id,
          name: resource.name || 'Sin nombre',
          icon: 'Activity' // Puedes poner un ícono por defecto
        };
      });
    } catch (error) {
      console.error("Error cargando especialidades desde FHIR, usando mocks temporales", error);
      return getMockSpecialties();
    }
  },

  getDoctorsBySpecialty: async (specialtyId: string): Promise<Doctor[]> => {
    try {
      // Pedimos los médicos ("Practitioner")
      // Nota: En FHIR real se filtraría por rol/especialidad, aquí traemos todos para probar
      const response = await axios.get(`${FHIR_BASE_URL}/Practitioner`);
      const bundle = response.data;
      
      if (!bundle.entry || bundle.entry.length === 0) {
        return getMockDoctors(specialtyId);
      }

      return bundle.entry.map((item: any) => {
        const doc = item.resource;
        // Buscamos el nombre dentro del formato complejo de FHIR
        const nameObj = doc.name && doc.name[0] ? doc.name[0] : null;
        const fullName = nameObj ? `${nameObj.prefix?.[0] || ''} ${nameObj.given?.join(' ') || ''} ${nameObj.family || ''}`.trim() : 'Dr. Sin Nombre';

        return {
          id: doc.id,
          name: fullName,
          title: 'Médico',
          specialty: specialtyId, // Lo forzamos a la especialidad seleccionada por ahora
          bio: 'Información traída directamente desde FHIR.',
          experience: 5,
          slots: 8
        };
      });
    } catch (error) {
      console.error("Error cargando profesionales desde FHIR, usando mocks", error);
      return getMockDoctors(specialtyId);
    }
  }
};

// --- MOCKS DE EMERGENCIA ---
function getMockSpecialties(): SpecialtyDTO[] {
  return [
    { id: 'esp-1', name: 'Cardiología', icon: 'Heart' },
    { id: 'esp-2', name: 'Neurología', icon: 'Brain' },
    { id: 'esp-3', name: 'Traumatología', icon: 'Bone' },
    { id: 'esp-4', name: 'Pediatría', icon: 'Baby' },
    { id: 'esp-5', name: 'Medicina General', icon: 'Stethoscope' }
  ];
}

function getMockDoctors(specialtyId: string): Doctor[] {
  return [
    {
      id: `doc-1-${specialtyId}`,
      name: 'Dr. Roberto Sánchez',
      title: 'Especialista en su área',
      specialty: specialtyId,
      bio: 'Médico cirujano con más de 10 años de experiencia.',
      experience: 12,
      slots: 5
    },
    {
      id: `doc-2-${specialtyId}`,
      name: 'Dra. María González',
      title: 'Jefe de Servicio',
      specialty: specialtyId,
      bio: 'Atención especializada e integral para todos los pacientes.',
      experience: 8,
      slots: 2
    },
    {
      id: `doc-3-${specialtyId}`,
      name: 'Dr. Alejandro Fernández',
      title: 'Médico Tratante',
      specialty: specialtyId,
      bio: 'Evaluaciones completas y procedimientos ambulatorios.',
      experience: 5,
      slots: 0
    }
  ];
}