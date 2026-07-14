import { urgenciaApi } from './urgencia.api';

const URGENCIAS_BASE = '/urgencias';

export const urgenciaRemote = {
  ingreso(payload: { rut: string; motivo: string; nombre?: string }): Promise<string> {
    return urgenciaApi.post<string>(`${URGENCIAS_BASE}/ingreso`, payload).then(r => r.data);
  },

  triage(idEncuentro: string, payload: any): Promise<string> {
    return urgenciaApi.put<string>(`${URGENCIAS_BASE}/triage/${idEncuentro}`, payload).then(r => r.data);
  },

  consultarEspera(rut: string): Promise<{ rut: string; tiempoEsperaMinutos: number; idEncuentro: string }> {
    return urgenciaApi.get<{ rut: string; tiempoEsperaMinutos: number; idEncuentro: string }>(`${URGENCIAS_BASE}/espera/${rut}`).then(r => r.data);
  },

  rechazar(payload: { idEncuentro: string; rutConfirmacion: string }): Promise<string> {
    return urgenciaApi.put<string>(`${URGENCIAS_BASE}/rechazo`, payload).then(r => r.data);
  },

  getFicha(idEncuentro: string): Promise<any> {
    return urgenciaApi.get<any>(`${URGENCIAS_BASE}/ficha/${idEncuentro}`).then(r => r.data);
  },

  alta(idEncuentro: string, payload: { diagnostico: string, hospitalizacion?: boolean }): Promise<string> {
    return urgenciaApi.put<string>(`${URGENCIAS_BASE}/alta/${idEncuentro}`, payload).then(r => r.data);
  },

  asignarBox(idEncuentro: string, box: string): Promise<string> {
    return urgenciaApi.put<string>(`${URGENCIAS_BASE}/box/${idEncuentro}`, { box }).then(r => r.data);
  },

  getPendientes(): Promise<any[]> {
    return urgenciaApi.get<any[]>(`${URGENCIAS_BASE}/pendientes?_t=${Date.now()}`).then(r => r.data);
  },

  getTriaged(): Promise<any[]> {
    return urgenciaApi.get<any[]>(`${URGENCIAS_BASE}/triaged?_t=${Date.now()}`).then(r => r.data);
  },

  getAltas(): Promise<any[]> {
    return urgenciaApi.get<any[]>(`${URGENCIAS_BASE}/altas`).then(r => r.data);
  },

  getRechazadas(): Promise<any[]> {
    return urgenciaApi.get<any[]>(`${URGENCIAS_BASE}/rechazadas`).then(r => r.data);
  },

  indicarTratamiento(idEncuentro: string, payload: { medicamento: string; indicaciones: string }): Promise<string> {
    return urgenciaApi.post<string>(`${URGENCIAS_BASE}/tratamiento/${idEncuentro}`, payload).then(r => r.data);
  },

  getTratamientosPendientes(): Promise<any[]> {
    return urgenciaApi.get<any[]>(`${URGENCIAS_BASE}/tratamientos/pendientes?_t=${Date.now()}`).then(r => r.data);
  },

  resolverTratamiento(idRequest: string, payload: { estado: string; dosis?: string; via?: string; tecnica?: string; motivo?: string }): Promise<string> {
    return urgenciaApi.put<string>(`${URGENCIAS_BASE}/tratamiento/${idRequest}/resolver`, payload).then(r => r.data);
  }
};
