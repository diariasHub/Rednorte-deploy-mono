import { urgenciaRemote } from '../remotes/urgencia.remote';

class UrgenciaService {
  ingreso(rut: string, motivo: string, nombre?: string): Promise<string> {
    return urgenciaRemote.ingreso({ rut, motivo, nombre });
  }

  triage(idEncuentro: string, payload: any): Promise<string> {
    return urgenciaRemote.triage(idEncuentro, payload);
  }

  consultarEspera(rut: string): Promise<{ rut: string; tiempoEsperaMinutos: number }> {
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
}

export const urgenciaService = new UrgenciaService();
