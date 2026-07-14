import { urgenciaRemote } from '../remotes/urgencia.remote';

class UrgenciaService {
  ingreso(rut: string, motivo: string, nombre?: string): Promise<string> {
    return urgenciaRemote.ingreso({ rut, motivo, nombre });
  }

  triage(idEncuentro: string, payload: any): Promise<string> {
    return urgenciaRemote.triage(idEncuentro, payload);
  }

  consultarEspera(rut: string): Promise<{ rut: string; tiempoEsperaMinutos: number; idEncuentro: string }> {
    return urgenciaRemote.consultarEspera(rut);
  }

  rechazar(idEncuentro: string, rutConfirmacion: string): Promise<string> {
    return urgenciaRemote.rechazar({ idEncuentro, rutConfirmacion });
  }

  getFicha(idEncuentro: string): Promise<any> {
    return urgenciaRemote.getFicha(idEncuentro);
  }

  alta(idEncuentro: string, diagnostico: string, hospitalizacion: boolean = false): Promise<string> {
    return urgenciaRemote.alta(idEncuentro, { diagnostico, hospitalizacion });
  }

  asignarBox(idEncuentro: string, box: string): Promise<string> {
    return urgenciaRemote.asignarBox(idEncuentro, box);
  }

  getPendientes(): Promise<any[]> {
    return urgenciaRemote.getPendientes();
  }

  getTriaged(): Promise<any[]> {
    return urgenciaRemote.getTriaged();
  }

  getAltas(): Promise<any[]> {
    return urgenciaRemote.getAltas();
  }

  getRechazadas(): Promise<any[]> {
    return urgenciaRemote.getRechazadas();
  }

  indicarTratamiento(idEncuentro: string, medicamento: string, indicaciones: string): Promise<string> {
    return urgenciaRemote.indicarTratamiento(idEncuentro, { medicamento, indicaciones });
  }

  getTratamientosPendientes(): Promise<any[]> {
    return urgenciaRemote.getTratamientosPendientes();
  }

  resolverTratamiento(idRequest: string, payload: { estado: string; dosis?: string; via?: string; tecnica?: string; motivo?: string }): Promise<string> {
    return urgenciaRemote.resolverTratamiento(idRequest, payload);
  }
}

export const urgenciaService = new UrgenciaService();
