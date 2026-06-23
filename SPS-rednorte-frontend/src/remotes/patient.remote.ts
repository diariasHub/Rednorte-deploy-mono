import axios from 'axios';

const FHIR_BASE_URL = 'http://localhost:8085/fhir';

export const patientRemote = {
  // 1. 🛡️ BYPASS PARA LAS PREVISIONES
  getCoverages: async (): Promise<any[]> => {
    return [];
  },

  getTotalCount: async (): Promise<number> => {
    try {
      const response = await axios.get(`${FHIR_BASE_URL}/Patient?_summary=count`);
      return response.data.total || 0;
    } catch (e) {
      console.error(e);
      return 0;
    }
  },

  // 2. 🛡️ BYPASS PARA LA BÚSQUEDA POR RUT
  getPatientByRut: async (rut: string): Promise<any> => {
    try {
      const response = await axios.get(`${FHIR_BASE_URL}/Patient?identifier=${rut}`);
      const bundle = response.data;

      if (bundle.entry && bundle.entry.length > 0) {
        const patient = bundle.entry[0].resource;
        const cleanPatientId = patient.id; 

        let previsionActual = 'Particular'; 
        try {
          const coverageResponse = await axios.get(`${FHIR_BASE_URL}/Coverage/cov-${cleanPatientId}`);
          const coverageData = coverageResponse.data;
          
          if (coverageData?.type?.coding?.[0]?.display) {
            previsionActual = coverageData.type.coding[0].display;
          }
        } catch (covError) {
          console.warn(`Paciente no tenía un recurso Coverage activo, se asigna Particular.`);
        }

        return {
          id: cleanPatientId,
          rut: rut,
          name: patient.name?.[0]?.given?.join(' ') || '',
          lastName: patient.name?.[0]?.family || '',
          email: patient.telecom?.find((t: any) => t.system === 'email')?.value || '',
          phone: patient.telecom?.find((t: any) => t.system === 'phone')?.value || '',
          prevision: previsionActual,
          birthDate: patient.birthDate || '' // 🔥 Recuperamos la fecha de nacimiento si ya la tiene
        };
      }

      throw new Error('Paciente no encontrado en la base de datos');

    } catch (error) {
      throw error;
    }
  },

  // 3. 🔥 CREAR O ACTUALIZAR PACIENTE DIRECTO EN HAPI FHIR
  // 3. 🔥 CREAR O ACTUALIZAR PACIENTE DIRECTO EN HAPI FHIR
  upsert: async (patientData: any): Promise<any> => {
    try {
      // 1. Usamos EXACTAMENTE el mismo ID que usa tu sistema de reservas (prefijo "p-")
      const rawRut = patientData.identifierValue.replace(/[^0-9kK]/g, '').toLowerCase();
      const patientId = `p-${rawRut}`;

      // 2. Construimos el JSON nativo
      const fhirPatient: any = {
        resourceType: "Patient",
        id: patientId,
        active: true,
        identifier: [{
          system: "https://www.registrocivil.cl/RUT",
          value: patientData.identifierValue
        }],
        name: [{
          use: "official",
          family: patientData.lastName,
          given: [patientData.firstName]
        }],
        telecom: []
      };

      // 3. Validamos que teléfono y email no estén vacíos antes de enviarlos
      if (patientData.phone && patientData.phone.trim() !== "") {
        fhirPatient.telecom.push({ system: "phone", value: patientData.phone });
      }
      if (patientData.email && patientData.email.trim() !== "") {
        fhirPatient.telecom.push({ system: "email", value: patientData.email });
      }

      // 4. 🔥 AGREGAMOS LA FECHA SOLO SI EXISTE (Esto evita el Error 400 de FHIR)
      if (patientData.birthDate && patientData.birthDate.trim() !== "") {
        fhirPatient.birthDate = patientData.birthDate;
      }

      // 5. Hacemos el PUT a HAPI FHIR para actualizar el paciente recién creado
      const response = await axios.put(`${FHIR_BASE_URL}/Patient/${patientId}`, fhirPatient);
      
      return response.data;
    } catch (error) {
      console.error("Error al guardar paciente en FHIR:", error);
      throw error;
    }
  }
};