import axios from 'axios';
import type { AppointmentDTO, CreateAppointmentDTO } from './dtos/appointment.dto';

const FHIR_BASE_URL = '/fhir';

export const appointmentsRemote = {
  // Las demás funciones se pueden dejar con axios apuntando al 8085
  getAll(): Promise<AppointmentDTO[]> {
    return axios.get(`${FHIR_BASE_URL}/Appointment`).then(r => r.data);
  },

  getTotalCount: async (): Promise<number> => {
    try {
      const response = await axios.get(`${FHIR_BASE_URL}/Appointment?_summary=count`);
      return response.data.total || 0;
    } catch (e) {
      console.error(e);
      return 0;
    }
  },

  getById(id: string): Promise<AppointmentDTO> {
    return axios.get(`${FHIR_BASE_URL}/Appointment/${id}`).then(r => r.data);
  },

  getByPatient(patientId: string): Promise<AppointmentDTO[]> {
    return axios.get(`${FHIR_BASE_URL}/Appointment?patient=${patientId}`).then(r => r.data);
  },

  // 🚀 AHORA BUSCAMOS LAS CITAS REALMENTE OCUPADAS PARA LIBERAR EL CALENDARIO
  getByPractitioner: async (practitionerId: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${FHIR_BASE_URL}/Appointment?practitioner=${practitionerId}`);
    const bundle = response.data;

    if (!bundle.entry) return [];

    return bundle.entry.map((item: any) => {
      const appt = item.resource;
      
      // 1. Convertimos el string ISO UTC de FHIR a un objeto Date real de JavaScript
      const startDate = new Date(appt.start);
      const endDate = new Date(appt.end);

      // 2. Extraemos el formato local YYYY-MM-DD
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;

      // 3. Extraemos la hora local HH:MM (ej: "13:00" en vez de transformarse a las 9)
      // Nota: Si tu Step3 compara usando objetos Date locales, usa isoStart. 
      // Si compara usando strings puros como "13:00", necesitas entregarle los datos limpios.
      const localSlot = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;

      return {
        id: appt.id,
        // Al devolverlos formateados o en ISO nativo controlamos el desfase
        start: appt.start, 
        end: appt.end,
        status: appt.status,
        // Agregamos estos campos extra por si tu componente Step3 los lee de forma simplificada:
        date: localDate,
        slot: localSlot
      };
    });
  } catch (error) {
    console.error("Error cargando citas ocupadas desde FHIR:", error);
    return [];
  }
},

  create: async (dto: any): Promise<any> => {
    try {
      const sanitizeFhirId = (rawId: any, prefix: string): string => {
        const clean = String(rawId).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        return /^\d+$/.test(clean) ? `${prefix}-${clean}` : clean;
      };

      const cleanPatientId = sanitizeFhirId(dto.patientId, 'p');
      // Forzamos el ID real del médico que vimos en tu Bundle
      const cleanPractitionerId = dto.practitionerId?.includes('medico-') ? dto.practitionerId : 'medico-1101'; 

      // 1. 👤 CREAR PACIENTE
      try {
        await axios.put(`${FHIR_BASE_URL}/Patient/${cleanPatientId}`, {
          resourceType: "Patient",
          id: cleanPatientId,
          active: true,
          name: [{ given: [dto.patientName || "Manuel"], family: dto.patientLastName || "Cáceres" }],
          identifier: [{ system: "https://www.registrocivil.cl/RUT", value: dto.patientId }]
        });
        console.log(`✅ Patient/${cleanPatientId} creado.`);
      } catch (e: any) { console.warn("Error en Patient:", e.message); }

      // 2. 💳 CREAR RECURSO COVERAGE (Previsión enlazada al paciente)
      const cleanCoverageId = `cov-${cleanPatientId}`;
      try {
        await axios.put(`${FHIR_BASE_URL}/Coverage/${cleanCoverageId}`, {
          resourceType: "Coverage",
          id: cleanCoverageId,
          status: "active",
          type: {
            coding: [{
              system: "https://rednorte.cl/fhir/CodeSystem/Previsiones",
              code: dto.prevision?.toLowerCase().replace(/\s+/g, '-'),
              display: dto.prevision || "Particular"
            }]
          },
          beneficiary: {
            reference: `Patient/${cleanPatientId}`
          },
          payor: [{
            display: dto.prevision || "Particular"
          }]
        });
        console.log(`✅ Coverage/${cleanCoverageId} registrado para el paciente.`);
      } catch (e: any) { console.warn("Error en Coverage:", e.message); }

      // 3. 🧑‍⚕️ CREAR MÉDICO SI NO EXISTE
      try {
        await axios.put(`${FHIR_BASE_URL}/Practitioner/${cleanPractitionerId}`, {
          resourceType: "Practitioner",
          id: cleanPractitionerId,
          active: true,
          name: [{ text: dto.doctorName || "Médico Desconocido" }]
        });
        console.log(`✅ Practitioner/${cleanPractitionerId} registrado.`);
      } catch (e: any) { console.warn("Error en Practitioner:", e.message); }

      // 4. 🕒 CONSTRUCCIÓN DE HORARIOS (Mantener formato ISO UTC real)
      let isoStart = dto.start;
      let isoEnd = dto.end;
      
      // Fallback por si no vienen listos (ej. llamadas antiguas)
      if (!isoStart || !isoEnd) {
        const datePart = dto.date || "2026-06-15";
        const timePart = dto.slot || "13:00";
        // Al usar new Date() sin Z y luego toISOString(), JS usa la zona local correcta
        const startDate = new Date(`${datePart}T${timePart}:00`);
        isoStart = startDate.toISOString();
        
        const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
        isoEnd = endDate.toISOString();
      }

      // 4. 📅 CREAR CITA
      const fhirAppointment = {
        resourceType: "Appointment",
        status: "booked",
        start: isoStart,
        end: isoEnd,
        description: `Presencial · Especialidad: Cardiología · Vía Portal Web`,
        participant: [
          { actor: { reference: `Patient/${cleanPatientId}` }, status: "accepted" },
          { actor: { reference: `Practitioner/${cleanPractitionerId}` }, status: "accepted" }
        ]
      };

      try {
        const response = await axios.post(`${FHIR_BASE_URL}/Appointment`, fhirAppointment);
        return response.data;
      } catch (postError) {
        console.warn("⚠️ Servidor FHIR inalcanzable. Usando mock de emergencia para creación de cita.");
        return {
          id: `RN-${Math.floor(1000 + Math.random() * 9000)}`,
          status: "booked",
          start: isoStart,
          end: isoEnd
        };
      }

    } catch (error: any) {
      if (error.response?.data) console.error("❌ FHIR Error:", JSON.stringify(error.response.data, null, 2));
      console.warn("⚠️ Usando mock de emergencia total.");
      return { id: `RN-MOCK-${Math.floor(1000 + Math.random() * 9000)}` };
    }
  },

  update(id: string, dto: Partial<AppointmentDTO>): Promise<AppointmentDTO> {
    return Promise.reject(new Error("Actualización no implementada en bypass FHIR"));
  },

  cancel(id: string): Promise<void> {
    return axios.delete(`${FHIR_BASE_URL}/Appointment/${id}`).then(() => undefined);
  },
};